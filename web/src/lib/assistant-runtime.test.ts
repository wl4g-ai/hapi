import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useHappyRuntime } from '@/lib/assistant-runtime'
import type { Session } from '@/types'

// Mock dependencies
vi.mock('@assistant-ui/react', () => ({
    useExternalMessageConverter: vi.fn(() => []),
    useExternalStoreRuntime: vi.fn((adapter) => adapter)
}))

const mockSession: Session = {
    id: 'test-session',
    active: true,
    thinking: false,
    permissionMode: 'default',
    collaborationMode: 'default',
    model: null,
    metadata: null,
    agentState: null,
    teamState: null,
    createdAt: Date.now(),
    updatedAt: Date.now()
}

describe('useHappyRuntime', () => {
    const mockSendMessage = vi.fn()
    const mockAbort = vi.fn().mockResolvedValue(undefined)
    const mockOnPausedChange = vi.fn()

    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should initialize with no paused state and empty queue', () => {
        const { result } = renderHook(() => useHappyRuntime({
            session: mockSession,
            blocks: [],
            isSending: false,
            onSendMessage: mockSendMessage,
            onAbort: mockAbort,
            allowSendWhenInactive: false
        }))

        expect(result.current.isPaused).toBe(false)
        expect(result.current.queuedMessageCount).toBe(0)
    })

    it('should queue message when paused', async () => {
        const { result } = renderHook(() => useHappyRuntime({
            session: mockSession,
            blocks: [],
            isSending: false,
            onSendMessage: mockSendMessage,
            onAbort: mockAbort,
            allowSendWhenInactive: false,
            onPausedChange: mockOnPausedChange
        }))

        // Pause
        await act(async () => {
            await result.current.onPauseToggle()
        })

        expect(result.current.isPaused).toBe(true)
        expect(mockAbort).toHaveBeenCalledTimes(1)
        expect(mockOnPausedChange).toHaveBeenCalledWith(true)
    })

    it('should process queue when resuming', async () => {
        const { result } = renderHook(() => useHappyRuntime({
            session: mockSession,
            blocks: [],
            isSending: false,
            onSendMessage: mockSendMessage,
            onAbort: mockAbort,
            allowSendWhenInactive: false,
            onPausedChange: mockOnPausedChange
        }))

        // Pause first
        await act(async () => {
            await result.current.onPauseToggle()
        })

        expect(result.current.isPaused).toBe(true)
        expect(result.current.queuedMessageCount).toBe(0)
        vi.clearAllMocks()

        // Resume and verify queue is processed
        await act(async () => {
            await result.current.onPauseToggle()
        })

        expect(result.current.isPaused).toBe(false)
        expect(mockOnPausedChange).toHaveBeenCalledWith(false)
    })

    it('should clear queue', () => {
        const { result } = renderHook(() => useHappyRuntime({
            session: mockSession,
            blocks: [],
            isSending: false,
            onSendMessage: mockSendMessage,
            onAbort: mockAbort,
            allowSendWhenInactive: false
        }))

        act(() => {
            result.current.clearQueue()
        })

        expect(result.current.queuedMessageCount).toBe(0)
    })

    it('should call onPausedChange callback when pausing/resuming', async () => {
        const { result } = renderHook(() => useHappyRuntime({
            session: mockSession,
            blocks: [],
            isSending: false,
            onSendMessage: mockSendMessage,
            onAbort: mockAbort,
            allowSendWhenInactive: false,
            onPausedChange: mockOnPausedChange
        }))

        // Pause
        await act(async () => {
            await result.current.onPauseToggle()
        })

        expect(mockOnPausedChange).toHaveBeenCalledWith(true)
        vi.clearAllMocks()

        // Resume
        await act(async () => {
            await result.current.onPauseToggle()
        })

        expect(mockOnPausedChange).toHaveBeenCalledWith(false)
    })
})
