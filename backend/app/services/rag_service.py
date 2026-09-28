import re
import time
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.question_bank import QuestionBank

# ============================================================
# CURATED KNOWLEDGE & TRUSTED SEED QUESTIONS
# ============================================================

CURATED_SEED_QUESTIONS = [
    # Java
    {
        "role": "Java Developer",
        "topic": "Multithreading",
        "subtopic": "Synchronization & Locks",
        "difficulty": "Advanced",
        "question_type": "mcq",
        "question_text": "In high-throughput Java applications, why is LongAdder preferred over AtomicLong under high thread contention?",
        "options_json": '["LongAdder uses a cell array to distribute contention across threads without CAS spin loops", "LongAdder acquires an exclusive OS-level mutex lock", "LongAdder eliminates cache coherence traffic completely", "AtomicLong does not support 64-bit integer values"]',
        "correct_answer": 0,
        "explanation": "LongAdder maintains an internal cell array where each thread updates its own cell independently, reducing CAS contention under heavy write traffic. The sum() method aggregates the cells.",
        "quality_score": 9.5,
        "approval_status": "approved",
        "source": "curated",
    },
    {
        "role": "Java Developer",
        "topic": "JVM Internals",
        "subtopic": "Garbage Collection",
        "difficulty": "Advanced",
        "question_type": "mcq",
        "question_text": "What is the primary mechanism G1GC uses to achieve predictable pause-time targets in large heaps?",
        "options_json": '["It partitions the heap into equal-sized regions and prioritizes regions with the most garbage (Garbage-First)", "It runs a full-stop-the-world compaction on every allocation", "It disables the young generation entirely", "It executes garbage collection purely on GPU threads"]',
        "correct_answer": 0,
        "explanation": "G1GC divides heap memory into contiguous regions and tracks the amount of live data per region, collecting regions with the highest reclaimable space first within the configured pause time goal.",
        "quality_score": 9.3,
        "approval_status": "approved",
        "source": "curated",
    },
    # MERN / React
    {
        "role": "MERN Stack Developer",
        "topic": "React Architecture",
        "subtopic": "Concurrency & Memoization",
        "difficulty": "Intermediate",
        "question_type": "mcq",
        "question_text": "When should React.useCallback be paired with React.memo on a child component?",
        "options_json": '["When passing a callback prop to a memoized child component to prevent unnecessary re-renders", "On every single function inside any functional component", "To force child components to bypass the virtual DOM", "Only when performing asynchronous fetch calls inside useEffect"]',
        "correct_answer": 0,
        "explanation": "useCallback caches function instances across renders. It prevents child re-renders only if the child is wrapped in React.memo and relies on reference equality.",
        "quality_score": 9.2,
        "approval_status": "approved",
        "source": "curated",
    },
    # Python
    {
        "role": "Python Developer",
        "topic": "Asynchronous Programming",
        "subtopic": "Asyncio & Event Loop",
        "difficulty": "Advanced",
        "question_type": "mcq",
        "question_text": "What occurs when a CPU-bound blocking function is invoked directly inside an asyncio coroutine?",
        "options_json": '["It blocks the entire single-threaded event loop, preventing all other concurrent tasks from progressing", "Asyncio automatically delegates CPU tasks to a background thread pool", "The coroutine raises a BlockedEventLoopException immediately", "The Python GIL is temporarily released for other threads"]',
        "correct_answer": 0,
        "explanation": "Because asyncio runs on a single event loop thread, synchronous CPU-bound operations freeze the loop. CPU-bound work must be offloaded via loop.run_in_executor() or multiprocessing.",
        "quality_score": 9.6,
        "approval_status": "approved",
        "source": "curated",
    },
    # DSA
    {
        "role": "Data Structures & Algorithms",
        "topic": "Dynamic Programming",
        "subtopic": "Subsequence Problems",
        "difficulty": "Advanced",
        "question_type": "mcq",
        "question_text": "What is the optimal time complexity to solve the Longest Increasing Subsequence (LIS) problem of size N using binary search with patience sorting?",
        "options_json": '["O(N log N)", "O(N^2)", "O(N)", "O(2^N)"]',
        "correct_answer": 0,
        "explanation": "By maintaining an active tails array and using binary search (bisect_left) to replace or append values, LIS is computed in O(N log N) time and O(N) auxiliary space.",
        "quality_score": 9.4,
        "approval_status": "approved",
        "source": "curated",
    },
]


def seed_curated_questions_if_empty(db: Session):
    """Populates curated baseline questions into QuestionBank if empty."""
    count = db.query(QuestionBank).filter(QuestionBank.source == "curated").count()
    if count == 0:
        for item in CURATED_SEED_QUESTIONS:
            q = QuestionBank(
                role=item["role"],
                topic=item["topic"],
                subtopic=item["subtopic"],
                difficulty=item["difficulty"],
                question_type=item["question_type"],
                question_text=item["question_text"],
                options_json=item["options_json"],
                correct_answer=item["correct_answer"],
                explanation=item["explanation"],
                quality_score=item["quality_score"],
                approval_status=item["approval_status"],
                quality_status=item["approval_status"],
                source=item["source"],
            )
            db.add(q)
        db.commit()


# ============================================================
# BOUNDED HYBRID RAG RETRIEVAL WITH OBSERVABILITY
# ============================================================

def retrieve_grounded_context(
    db: Session,
    role: str,
    topic: Optional[str] = None,
    subtopic: Optional[str] = None,
    difficulty: Optional[str] = "Intermediate",
    candidate_weaknesses: Optional[List[str]] = None,
    resume_skills: Optional[List[str]] = None,
    exclude_question_ids: Optional[List[int]] = None,
    limit: int = 3,
) -> Dict[str, Any]:
    """
    Bounded hybrid retrieval matching approved questions in QuestionBank.
    Instruments latency, relevance score, and match dimensions into AIRequestLog.
    """
    start_time = time.perf_counter()
    seed_curated_questions_if_empty(db)

    # 1. Base query: strictly approved questions matching role or general algorithms
    clean_role = role.split("(")[0].strip()
    query = db.query(QuestionBank).filter(
        QuestionBank.approval_status == "approved"
    )

    if exclude_question_ids:
        query = query.filter(~QuestionBank.id.in_(exclude_question_ids))

    all_approved = query.all()
    if not all_approved:
        latency_ms = (time.perf_counter() - start_time) * 1000.0
        try:
            from app.services.observability_service import log_ai_request
            log_ai_request(
                db=db,
                service_name="rag",
                operation="retrieve_context",
                latency_ms=latency_ms,
                success=True,
                metadata={"retrieved_count": 0, "role": role, "topic": topic},
            )
        except Exception:
            pass

        return {
            "retrieved_questions": [],
            "source_ids": [],
            "retrieval_source": "gemini_direct",
            "context_summary": "No pre-existing approved questions available for reference.",
        }

    # 2. Hybrid Scoring Algorithm
    weaknesses_lower = [w.lower() for w in (candidate_weaknesses or [])]
    skills_lower = [s.lower() for s in (resume_skills or [])]
    target_topic = (topic or "").lower()
    target_sub = (subtopic or "").lower()
    target_diff = (difficulty or "Intermediate").lower()

    scored_candidates = []
    for q in all_approved:
        score = 0.0

        # Role alignment
        q_role = (q.role or "").lower()
        if clean_role.lower() in q_role or q_role in clean_role.lower():
            score += 3.0

        # Topic match
        q_topic = (q.topic or "").lower()
        if target_topic and (target_topic in q_topic or q_topic in target_topic):
            score += 3.5

        # Subtopic match
        q_sub = (q.subtopic or "").lower()
        if target_sub and (target_sub in q_sub or q_sub in target_sub):
            score += 2.5

        # Difficulty match
        q_diff = (q.difficulty or "").lower()
        if target_diff == q_diff:
            score += 1.5

        # Candidate weakness alignment
        for w in weaknesses_lower:
            if w in q_topic or w in q_sub or w in q.question_text.lower():
                score += 2.0
                break

        # Resume skills alignment
        for s in skills_lower:
            if s in q_topic or s in q_sub or s in q.question_text.lower():
                score += 1.0
                break

        # Quality score bias
        if q.quality_score:
            score += (q.quality_score / 10.0) * 0.5

        scored_candidates.append((score, q))

    # Sort descending by computed relevance score
    scored_candidates.sort(key=lambda x: x[0], reverse=True)
    top_matches = [q for score, q in scored_candidates[:limit] if score > 0]

    if not top_matches:
        top_matches = [q for _, q in scored_candidates[:limit]]

    source_ids = [q.id for q in top_matches]
    context_snippets = []
    for q in top_matches:
        context_snippets.append(
            f"- Topic: {q.topic} ({q.subtopic or 'General'})\n"
            f"  Difficulty: {q.difficulty}\n"
            f"  Question: {q.question_text}\n"
            f"  Explanation: {q.explanation}"
        )

    latency_ms = (time.perf_counter() - start_time) * 1000.0

    # Log RAG observability trace
    try:
        from app.services.observability_service import log_ai_request
        log_ai_request(
            db=db,
            service_name="rag",
            operation="retrieve_context",
            latency_ms=latency_ms,
            success=True,
            metadata={
                "retrieved_count": len(top_matches),
                "source_ids": source_ids,
                "role": role,
                "topic": topic,
                "subtopic": subtopic,
                "difficulty": difficulty,
            },
        )
    except Exception:
        pass

    return {
        "retrieved_questions": [
            {
                "id": q.id,
                "role": q.role,
                "topic": q.topic,
                "subtopic": q.subtopic,
                "difficulty": q.difficulty,
                "question_text": q.question_text,
                "explanation": q.explanation,
                "quality_score": q.quality_score,
            }
            for q in top_matches
        ],
        "source_ids": source_ids,
        "retrieval_source": "curated_question_bank" if any(q.source == "curated" for q in top_matches) else "question_bank",
        "context_summary": "\n\n".join(context_snippets),
    }
