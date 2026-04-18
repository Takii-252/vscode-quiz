from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

OsType = Literal["mac", "windows"]


class Monster(BaseModel):
    name: str
    hp: int
    imageUrl: str


class NextQuestionResponse(BaseModel):
    questionId: int
    prompt: str
    category: str
    difficulty: int
    monster: Monster


class JudgeRequest(BaseModel):
    questionId: int
    os: OsType
    input: list[str] | str
    usedHint: bool = False


class JudgeResponse(BaseModel):
    isCorrect: bool
    normalizedInput: str
    acceptedAnswers: list[str]
    damage: int
    message: str


class HintResponse(BaseModel):
    hint: str


class ResultSaveRequest(BaseModel):
    userId: str | None = None
    clearedCount: int = Field(ge=0)
    correctCount: int = Field(ge=0)
    wrongCount: int = Field(ge=0)
    hintCount: int = Field(ge=0)
    score: int
    playedAt: datetime | None = None


class ResultSaveResponse(BaseModel):
    status: Literal["ok"]
    resultId: int


class WeaknessItem(BaseModel):
    questionId: int
    prompt: str
    wrongCount: int
    correctCount: int


class WeaknessResponse(BaseModel):
    items: list[WeaknessItem]

