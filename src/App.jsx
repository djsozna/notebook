import { useEffect, useId, useRef, useState } from 'react'
import './App.css'

const STORAGE_KEY = 'memo-app-notes'

function loadMemos() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function formatDate(ts) {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(ts))
}

function createMemo() {
  const now = Date.now()
  return {
    id: crypto.randomUUID(),
    title: '',
    content: '',
    createdAt: now,
    updatedAt: now,
  }
}

function SearchIcon() {
  return (
    <svg className="search-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function MemoCard({ memo, isEditing, draft, onDraftChange, onEdit, onSave, onDelete }) {
  const titleRef = useRef(null)

  useEffect(() => {
    if (isEditing && titleRef.current) {
      titleRef.current.focus()
      titleRef.current.select()
    }
  }, [isEditing])

  return (
    <article className={`memo${isEditing ? ' editing' : ''}`}>
      <div className="memo-meta">
        <time className="memo-date" dateTime={new Date(memo.updatedAt).toISOString()}>
          {formatDate(memo.updatedAt)}
        </time>
        <div className="memo-actions">
          {isEditing ? (
            <button type="button" className="btn btn-primary btn-sm" onClick={onSave}>
              저장
            </button>
          ) : (
            <button type="button" className="btn btn-ghost btn-sm" onClick={onEdit}>
              수정
            </button>
          )}
          <button type="button" className="btn btn-danger btn-sm" onClick={onDelete}>
            삭제
          </button>
        </div>
      </div>

      {isEditing ? (
        <>
          <input
            ref={titleRef}
            className="memo-title"
            type="text"
            placeholder="제목"
            value={draft.title}
            onChange={(e) => onDraftChange({ ...draft, title: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.preventDefault()
            }}
          />
          <textarea
            className="memo-body"
            placeholder="내용을 입력하세요"
            value={draft.content}
            onChange={(e) => onDraftChange({ ...draft, content: e.target.value })}
            rows={5}
          />
        </>
      ) : (
        <>
          <h2 className="memo-title">
            {memo.title.trim() || '제목 없음'}
          </h2>
          <p className="memo-body">
            {memo.content.trim() || '내용 없음'}
          </p>
        </>
      )}
    </article>
  )
}

export default function App() {
  const [memos, setMemos] = useState(loadMemos)
  const [query, setQuery] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [draft, setDraft] = useState({ title: '', content: '' })
  const searchId = useId()

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(memos))
  }, [memos])

  const filtered = memos.filter((memo) => {
    const q = query.trim().toLowerCase()
    if (!q) return true
    return (
      memo.title.toLowerCase().includes(q) ||
      memo.content.toLowerCase().includes(q)
    )
  })

  function handleNewMemo() {
    const memo = createMemo()
    setMemos((prev) => [memo, ...prev])
    setEditingId(memo.id)
    setDraft({ title: memo.title, content: memo.content })
  }

  function handleEdit(memo) {
    setEditingId(memo.id)
    setDraft({ title: memo.title, content: memo.content })
  }

  function handleSave() {
    if (!editingId) return
    setMemos((prev) =>
      prev.map((memo) =>
        memo.id === editingId
          ? {
              ...memo,
              title: draft.title,
              content: draft.content,
              updatedAt: Date.now(),
            }
          : memo,
      ),
    )
    setEditingId(null)
    setDraft({ title: '', content: '' })
  }

  function handleDelete(id) {
    const target = memos.find((m) => m.id === id)
    const label = target?.title?.trim() || '이 메모'
    if (!window.confirm(`"${label}"을(를) 삭제할까요?`)) return

    setMemos((prev) => prev.filter((memo) => memo.id !== id))
    if (editingId === id) {
      setEditingId(null)
      setDraft({ title: '', content: '' })
    }
  }

  return (
    <div className="app">
      <header className="header">
        <h1 className="brand">
          메모
          <span>생각을 적고, 찾아보세요</span>
        </h1>
        <button type="button" className="btn btn-primary" onClick={handleNewMemo}>
          새 메모
        </button>
      </header>

      <div className="toolbar">
        <div className="search">
          <SearchIcon />
          <label className="sr-only" htmlFor={searchId}>
            메모 검색
          </label>
          <input
            id={searchId}
            type="search"
            placeholder="메모 검색…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
          />
        </div>
      </div>

      <section className="memo-list" aria-live="polite">
        {filtered.length === 0 ? (
          <div className="empty">
            <strong>
              {memos.length === 0 ? '아직 메모가 없습니다' : '검색 결과가 없습니다'}
            </strong>
            {memos.length === 0
              ? '「새 메모」를 눌러 첫 메모를 만들어 보세요.'
              : '다른 키워드로 다시 검색해 보세요.'}
          </div>
        ) : (
          filtered.map((memo) => (
            <MemoCard
              key={memo.id}
              memo={memo}
              isEditing={editingId === memo.id}
              draft={draft}
              onDraftChange={setDraft}
              onEdit={() => handleEdit(memo)}
              onSave={handleSave}
              onDelete={() => handleDelete(memo.id)}
            />
          ))
        )}
      </section>
    </div>
  )
}
