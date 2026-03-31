import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams, useSearch } from '@tanstack/react-router'
import { useAppContext } from '@/lib/app-context'
import { useTranslation } from '@/lib/use-translation'

function BackIcon(props: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={props.className}
        >
            <polyline points="15 18 9 12 15 6" />
        </svg>
    )
}

function RefreshIcon(props: { className?: string; spinning?: boolean }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={props.spinning ? 'animate-spin' : ''}
        >
            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
            <path d="M16 21h5v-5" />
        </svg>
    )
}

function ExternalLinkIcon(props: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={props.className}
        >
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
    )
}

function HomeIcon(props: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={props.className}
        >
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
    )
}

interface PreviewSearch {
    url?: string
    port?: string
}

export default function PreviewPage() {
    const { api } = useAppContext()
    const { t } = useTranslation()
    const { sessionId } = useParams({ from: '/sessions/$sessionId/preview' })
    const search = useSearch({ from: '/sessions/$sessionId/preview' }) as { url?: string; port?: string }
    const navigate = useNavigate()

    const [url, setUrl] = useState('')
    const [iframeUrl, setIframeUrl] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [history, setHistory] = useState<string[]>([])
    const [historyIndex, setHistoryIndex] = useState(-1)

    const handleGoBack = useCallback(() => {
        navigate({ to: '/sessions/$sessionId', params: { sessionId } })
    }, [navigate, sessionId])

    // Build preview URL from port or use provided URL
    useEffect(() => {
        if (search.url) {
            setUrl(search.url)
            setIframeUrl(search.url)
            setHistory([search.url])
            setHistoryIndex(0)
        } else if (search.port) {
            const defaultUrl = `http://localhost:${search.port}`
            setUrl(defaultUrl)
            setIframeUrl(defaultUrl)
            setHistory([defaultUrl])
            setHistoryIndex(0)
        }
    }, [search.url, search.port])

    const handleNavigate = useCallback((newUrl: string) => {
        let formattedUrl = newUrl.trim()
        if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
            formattedUrl = 'http://' + formattedUrl
        }

        setUrl(formattedUrl)
        setIframeUrl(formattedUrl)
        setIsLoading(true)
        setError(null)

        // Update history
        setHistory(prev => {
            const newHistory = prev.slice(0, historyIndex + 1)
            newHistory.push(formattedUrl)
            return newHistory
        })
        setHistoryIndex(prev => prev + 1)
    }, [historyIndex])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        handleNavigate(url)
    }

    const handleGoForward = useCallback(() => {
        if (historyIndex < history.length - 1) {
            const newIndex = historyIndex + 1
            setHistoryIndex(newIndex)
            setIframeUrl(history[newIndex])
            setUrl(history[newIndex])
        }
    }, [history, historyIndex])

    const handleRefresh = useCallback(() => {
        setIsLoading(true)
        // Trigger iframe reload
        setIframeUrl('')
        setTimeout(() => setIframeUrl(url), 50)
    }, [url])

    const handleOpenExternal = useCallback(() => {
        window.open(iframeUrl, '_blank')
    }, [iframeUrl])

    const handleIframeLoad = useCallback(() => {
        setIsLoading(false)
        setError(null)
    }, [])

    const handleIframeError = useCallback(() => {
        setIsLoading(false)
        setError('无法加载页面。某些网站可能禁止在 iframe 中显示。')
    }, [])

    // Common dev server ports suggestions
    const commonPorts = [3000, 5173, 4200, 8080, 8000, 5500]

    return (
        <div className="flex h-full flex-col bg-[var(--app-bg)]">
            {/* Header */}
            <div className="border-b border-[var(--app-border)] pt-[env(safe-area-inset-top)]">
                <div className="flex items-center gap-2 p-3">
                    <button
                        type="button"
                        onClick={handleGoBack}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--app-hint)] transition-colors hover:bg-[var(--app-secondary-bg)] hover:text-[var(--app-fg)]"
                        title="返回会话"
                    >
                        <BackIcon />
                    </button>

                    <button
                        type="button"
                        onClick={handleGoBack}
                        disabled={historyIndex <= 0}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--app-hint)] transition-colors hover:bg-[var(--app-secondary-bg)] disabled:opacity-50 disabled:cursor-not-allowed"
                        title="返回"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <polyline points="15 18 9 12 15 6" />
                        </svg>
                    </button>

                    <form onSubmit={handleSubmit} className="flex-1 flex items-center gap-2">
                        <input
                            type="text"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="输入 URL 或选择端口..."
                            className="flex-1 rounded-full border border-[var(--app-border)] bg-[var(--app-secondary-bg)] px-4 py-2 text-sm text-[var(--app-fg)] placeholder-[var(--app-hint)] focus:outline-none focus:ring-2 focus:ring-[var(--app-link)]"
                        />
                        <button
                            type="submit"
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--app-link)] text-white transition-colors hover:opacity-80"
                            title="前往"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                            >
                                <line x1="5" y1="12" x2="19" y2="12" />
                                <polyline points="12 5 19 12 12 19" />
                            </svg>
                        </button>
                    </form>

                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={handleGoBack}
                            disabled={historyIndex <= 0}
                            className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--app-hint)] transition-colors hover:bg-[var(--app-secondary-bg)] disabled:opacity-50 disabled:cursor-not-allowed"
                            title="返回"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                            >
                                <polyline points="15 18 9 12 15 6" />
                            </svg>
                        </button>
                        <button
                            type="button"
                            onClick={handleGoForward}
                            disabled={historyIndex >= history.length - 1}
                            className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--app-hint)] transition-colors hover:bg-[var(--app-secondary-bg)] disabled:opacity-50 disabled:cursor-not-allowed"
                            title="前进"
                        >
                            <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                <polyline points="9 18 15 12 9 6" />
                            </svg>
                        </button>
                        <button
                            type="button"
                            onClick={handleRefresh}
                            className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--app-hint)] transition-colors hover:bg-[var(--app-secondary-bg)] hover:text-[var(--app-fg)]"
                            title="刷新"
                        >
                            <RefreshIcon spinning={isLoading} />
                        </button>
                        <button
                            type="button"
                            onClick={handleOpenExternal}
                            className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--app-hint)] transition-colors hover:bg-[var(--app-secondary-bg)] hover:text-[var(--app-fg)]"
                            title="在浏览器中打开"
                        >
                            <ExternalLinkIcon />
                        </button>
                    </div>
                </div>

                {/* Quick port suggestions */}
                {!search.url && !search.port && (
                    <div className="px-3 pb-2 flex items-center gap-2 overflow-x-auto">
                        <span className="text-xs text-[var(--app-hint)] whitespace-nowrap">快速访问:</span>
                        <button
                            type="button"
                            onClick={() => handleNavigate('http://localhost:3000')}
                            className="rounded-full bg-[var(--app-subtle-bg)] px-3 py-1 text-xs text-[var(--app-fg)] hover:bg-[var(--app-button)] hover:text-[var(--app-button-text)] transition-colors"
                        >
                            :3000
                        </button>
                        <button
                            type="button"
                            onClick={() => handleNavigate('http://localhost:5173')}
                            className="rounded-full bg-[var(--app-subtle-bg)] px-3 py-1 text-xs text-[var(--app-fg)] hover:bg-[var(--app-button)] hover:text-[var(--app-button-text)] transition-colors"
                        >
                            :5173
                        </button>
                        <button
                            type="button"
                            onClick={() => handleNavigate('http://localhost:4200')}
                            className="rounded-full bg-[var(--app-subtle-bg)] px-3 py-1 text-xs text-[var(--app-fg)] hover:bg-[var(--app-button)] hover:text-[var(--app-button-text)] transition-colors"
                        >
                            :4200
                        </button>
                        <button
                            type="button"
                            onClick={() => handleNavigate('http://localhost:8080')}
                            className="rounded-full bg-[var(--app-subtle-bg)] px-3 py-1 text-xs text-[var(--app-fg)] hover:bg-[var(--app-button)] hover:text-[var(--app-button-text)] transition-colors"
                        >
                            :8080
                        </button>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 min-h-0 relative">
                {error ? (
                    <div className="absolute inset-0 flex items-center justify-center p-4">
                        <div className="text-center">
                            <div className="text-lg font-semibold text-[var(--app-hint)] mb-2">
                                无法加载页面
                            </div>
                            <div className="text-sm text-[var(--app-hint)] mb-4">
                                {error}
                            </div>
                            <div className="text-xs text-[var(--app-hint)] max-w-md">
                                <p className="mb-2">提示：某些网站（如 Google、Facebook 等）禁止在 iframe 中显示。</p>
                                <p>如果是本地开发服务器，请确保：</p>
                                <ul className="list-disc list-inside mt-1 text-left">
                                    <li>服务器正在运行</li>
                                    <li>允许 iframe 嵌入（设置 Headers）</li>
                                    <li>CORS 配置正确</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                ) : (
                    <iframe
                        src={iframeUrl || 'about:blank'}
                        className="w-full h-full border-0"
                        title="Preview"
                        onLoad={handleIframeLoad}
                        onError={handleIframeError}
                        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                    />
                )}

                {isLoading && (
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-[var(--app-subtle-bg)] overflow-hidden">
                        <div className="h-full bg-[var(--app-link)] animate-pulse" style={{ width: '50%' }} />
                    </div>
                )}
            </div>
        </div>
    )
}
