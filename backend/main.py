from __future__ import annotations

from datetime import datetime, timezone

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from .models import (
    HintResponse,
    JudgeRequest,
    JudgeResponse,
    NextQuestionResponse,
    ResultSaveRequest,
    ResultSaveResponse,
    WeaknessItem,
    WeaknessResponse,
)
from .normalization import normalize_shortcut, to_display_shortcut
from .repository import (
    QuestionRepository,
    get_weakness,
    init_db,
    insert_result,
    upsert_progress,
)

app = FastAPI(title="VS Code Shortcut Quiz API", version="0.1.0")
repo = QuestionRepository()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MONSTER_BY_DIFFICULTY = {
    1: {"name": "ショートカットスライム", "hp": 12, "imageUrl": "/monsters/slime.png"},
    2: {"name": "コマンドゴブリン", "hp": 16, "imageUrl": "/monsters/goblin.png"},
    3: {"name": "デバッグドラゴン", "hp": 22, "imageUrl": "/monsters/dragon.png"},
}


@app.on_event("startup")
def on_startup() -> None:
    init_db()


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/questions/next", response_model=NextQuestionResponse)
def get_next_question(
    os: str = Query(default="mac", pattern="^(mac|windows)$"),
    level: int | None = Query(default=None, ge=1, le=3),
    category: str | None = Query(default=None),
    excludeIds: str | None = Query(default=None),
) -> NextQuestionResponse:
    _ = os
    exclude_set: set[int] = set()
    if excludeIds:
        for raw in excludeIds.split(","):
            if raw.strip().isdigit():
                exclude_set.add(int(raw.strip()))

    q = repo.next_question(level=level, category=category, exclude_ids=exclude_set)
    monster = MONSTER_BY_DIFFICULTY.get(q.difficulty, MONSTER_BY_DIFFICULTY[1])
    return NextQuestionResponse(
        questionId=q.id,
        prompt=q.prompt,
        category=q.category,
        difficulty=q.difficulty,
        monster=monster,
    )


@app.post("/api/questions/judge", response_model=JudgeResponse)
def judge_question(payload: JudgeRequest) -> JudgeResponse:
    q = repo.get_question_by_id(payload.questionId)
    if q is None:
        raise HTTPException(status_code=404, detail="Question not found")

    normalized_input = normalize_shortcut(payload.input)
    accepted = q.answers[payload.os]
    is_correct = normalized_input in accepted
    damage = 0
    if is_correct:
        damage = 2 if payload.usedHint else 4
        message = f"正解！{q.explanation}"
    else:
        canonical = to_display_shortcut(accepted[0], payload.os)
        message = f"不正解。正解は {canonical} です。"

    now_iso = datetime.now(timezone.utc).isoformat()
    upsert_progress(
        user_id=None,
        question_id=payload.questionId,
        is_correct=is_correct,
        played_at=now_iso,
    )

    return JudgeResponse(
        isCorrect=is_correct,
        normalizedInput=normalized_input,
        acceptedAnswers=[to_display_shortcut(a, payload.os) for a in accepted],
        damage=damage,
        message=message,
    )


@app.get("/api/questions/{question_id}/hint", response_model=HintResponse)
def get_hint(
    question_id: int,
    step: int = Query(default=1, ge=1, le=2),
    os: str = Query(default="mac", pattern="^(mac|windows)$"),
) -> HintResponse:
    _ = os
    q = repo.get_question_by_id(question_id)
    if q is None:
        raise HTTPException(status_code=404, detail="Question not found")

    if step == 1:
        hint = q.hint1 or "修飾キーと文字キーの組み合わせです。"
    else:
        hint = q.hint2 or f"答えは {to_display_shortcut(q.answers[os][0], os)} です。"
    return HintResponse(hint=hint)


@app.post("/api/results", response_model=ResultSaveResponse)
def save_result(payload: ResultSaveRequest) -> ResultSaveResponse:
    played_at = payload.playedAt or datetime.now(timezone.utc)
    result_id = insert_result(
        {
            "user_id": payload.userId,
            "cleared_count": payload.clearedCount,
            "correct_count": payload.correctCount,
            "wrong_count": payload.wrongCount,
            "hint_count": payload.hintCount,
            "score": payload.score,
            "played_at": played_at.isoformat(),
        }
    )
    return ResultSaveResponse(status="ok", resultId=result_id)


@app.get("/api/review/weakness", response_model=WeaknessResponse)
def review_weakness(limit: int = Query(default=10, ge=1, le=50)) -> WeaknessResponse:
    rows = get_weakness(limit=limit)
    items: list[WeaknessItem] = []
    for row in rows:
        q = repo.get_question_by_id(row["question_id"])
        if q is None:
            continue
        items.append(
            WeaknessItem(
                questionId=q.id,
                prompt=q.prompt,
                wrongCount=row["wrong_count"],
                correctCount=row["correct_count"],
            )
        )
    return WeaknessResponse(items=items)

