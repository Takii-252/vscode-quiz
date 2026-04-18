from __future__ import annotations

import json
import random
import sqlite3
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from .normalization import normalize_shortcut

BASE_DIR = Path(__file__).resolve().parent
DATA_FILE = BASE_DIR / "data" / "questions.json"
DB_FILE = BASE_DIR / "app.db"


@dataclass
class Question:
    id: int
    prompt: str
    category: str
    difficulty: int
    explanation: str
    tags: list[str]
    answers: dict[str, list[str]]
    hint1: str
    hint2: str


class QuestionRepository:
    def __init__(self, data_file: Path = DATA_FILE) -> None:
        self._questions = self._load_questions(data_file)

    @staticmethod
    def _load_questions(data_file: Path) -> list[Question]:
        with data_file.open("r", encoding="utf-8") as f:
            raw: list[dict[str, Any]] = json.load(f)

        questions: list[Question] = []
        for item in raw:
            normalized_answers = {
                "mac": [normalize_shortcut(v) for v in item["answers"]["mac"]],
                "windows": [normalize_shortcut(v) for v in item["answers"]["windows"]],
            }
            questions.append(
                Question(
                    id=item["id"],
                    prompt=item["prompt"],
                    category=item["category"],
                    difficulty=item["difficulty"],
                    explanation=item.get("explanation", ""),
                    tags=item.get("tags", []),
                    answers=normalized_answers,
                    hint1=item.get("hint1", ""),
                    hint2=item.get("hint2", ""),
                )
            )
        return questions

    def get_question_by_id(self, question_id: int) -> Question | None:
        for q in self._questions:
            if q.id == question_id:
                return q
        return None

    def next_question(
        self,
        level: int | None = None,
        category: str | None = None,
        exclude_ids: set[int] | None = None,
    ) -> Question:
        filtered = self._questions

        if level is not None:
            filtered = [q for q in filtered if q.difficulty == level]
        if category:
            filtered = [q for q in filtered if q.category == category]
        if exclude_ids:
            filtered = [q for q in filtered if q.id not in exclude_ids]

        if not filtered:
            filtered = self._questions

        return random.choice(filtered)


def init_db() -> None:
    conn = sqlite3.connect(DB_FILE)
    cur = conn.cursor()
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS battle_results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NULL,
            cleared_count INTEGER NOT NULL,
            correct_count INTEGER NOT NULL,
            wrong_count INTEGER NOT NULL,
            hint_count INTEGER NOT NULL,
            score INTEGER NOT NULL,
            played_at TEXT NOT NULL
        )
        """
    )
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS user_progress (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NULL,
            question_id INTEGER NOT NULL,
            correct_count INTEGER NOT NULL DEFAULT 0,
            wrong_count INTEGER NOT NULL DEFAULT 0,
            last_played_at TEXT NOT NULL
        )
        """
    )
    conn.commit()
    conn.close()


def insert_result(payload: dict[str, Any]) -> int:
    conn = sqlite3.connect(DB_FILE)
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO battle_results (
            user_id, cleared_count, correct_count, wrong_count, hint_count, score, played_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (
            payload.get("user_id"),
            payload["cleared_count"],
            payload["correct_count"],
            payload["wrong_count"],
            payload["hint_count"],
            payload["score"],
            payload["played_at"],
        ),
    )
    result_id = int(cur.lastrowid)
    conn.commit()
    conn.close()
    return result_id


def upsert_progress(
    *,
    user_id: str | None,
    question_id: int,
    is_correct: bool,
    played_at: str,
) -> None:
    conn = sqlite3.connect(DB_FILE)
    cur = conn.cursor()
    cur.execute(
        """
        SELECT id, correct_count, wrong_count
        FROM user_progress
        WHERE (user_id IS ? OR user_id = ?) AND question_id = ?
        LIMIT 1
        """,
        (user_id, user_id, question_id),
    )
    row = cur.fetchone()
    if row:
        progress_id, correct_count, wrong_count = row
        if is_correct:
            correct_count += 1
        else:
            wrong_count += 1
        cur.execute(
            """
            UPDATE user_progress
            SET correct_count = ?, wrong_count = ?, last_played_at = ?
            WHERE id = ?
            """,
            (correct_count, wrong_count, played_at, progress_id),
        )
    else:
        cur.execute(
            """
            INSERT INTO user_progress (user_id, question_id, correct_count, wrong_count, last_played_at)
            VALUES (?, ?, ?, ?, ?)
            """,
            (user_id, question_id, 1 if is_correct else 0, 0 if is_correct else 1, played_at),
        )
    conn.commit()
    conn.close()


def get_weakness(limit: int = 10) -> list[dict[str, Any]]:
    conn = sqlite3.connect(DB_FILE)
    cur = conn.cursor()
    cur.execute(
        """
        SELECT question_id, correct_count, wrong_count
        FROM user_progress
        ORDER BY wrong_count DESC, correct_count ASC
        LIMIT ?
        """,
        (limit,),
    )
    rows = cur.fetchall()
    conn.close()
    return [
        {
            "question_id": int(qid),
            "correct_count": int(correct),
            "wrong_count": int(wrong),
        }
        for qid, correct, wrong in rows
    ]

