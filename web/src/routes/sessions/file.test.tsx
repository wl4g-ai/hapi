import { describe, it, expect, beforeEach } from 'vitest'

// Test the search algorithm used by FileSearchBar
// The actual component uses a case-insensitive search with match highlighting

interface MatchRange {
    start: number
    end: number
}

function findAllMatches(content: string, searchTerm: string): MatchRange[] {
    if (!searchTerm) return []

    const matches: MatchRange[] = []
    const lowerContent = content.toLowerCase()
    const lowerTerm = searchTerm.toLowerCase()
    let index = 0

    while (index < lowerContent.length) {
        const matchIndex = lowerContent.indexOf(lowerTerm, index)
        if (matchIndex === -1) break
        matches.push({ start: matchIndex, end: matchIndex + searchTerm.length })
        index = matchIndex + 1
    }

    return matches
}

function navigateToNextMatch(matches: MatchRange[], currentIndex: number): number {
    if (matches.length === 0) return -1
    return (currentIndex + 1) % matches.length
}

function navigateToPrevMatch(matches: MatchRange[], currentIndex: number): number {
    if (matches.length === 0) return -1
    return (currentIndex - 1 + matches.length) % matches.length
}

describe('FileSearchBar search logic', () => {
    const mockContent = `
function hello() {
    console.log('Hello World')
    console.log('Hello again')
}
`

    it('should find all matches for a search term', () => {
        const searchTerm = 'Hello'
        const matches = findAllMatches(mockContent, searchTerm)

        expect(matches.length).toBe(3)
        expect(matches[0].start).toBeGreaterThan(0)
        expect(matches[1].start).toBeGreaterThan(matches[0].start)
        expect(matches[0].end).toBe(matches[0].start + searchTerm.length)
    })

    it('should handle case-insensitive search', () => {
        const searchTerm = 'hello'
        const matches = findAllMatches(mockContent, searchTerm)

        expect(matches.length).toBe(3)
    })

    it('should return empty matches for non-existent term', () => {
        const searchTerm = 'nonexistent12345'
        const matches = findAllMatches(mockContent, searchTerm)

        expect(matches.length).toBe(0)
    })

    it('should return empty matches for empty search term', () => {
        const matches = findAllMatches(mockContent, '')
        expect(matches.length).toBe(0)
    })

    it('should navigate through matches circularly', () => {
        const matches: MatchRange[] = [
            { start: 0, end: 5 },
            { start: 10, end: 15 },
            { start: 20, end: 25 }
        ]
        let currentIndex = 0

        // Next: 0 -> 1 -> 2 -> 0 (circular)
        currentIndex = navigateToNextMatch(matches, currentIndex)
        expect(currentIndex).toBe(1)

        currentIndex = navigateToNextMatch(matches, currentIndex)
        expect(currentIndex).toBe(2)

        currentIndex = navigateToNextMatch(matches, currentIndex)
        expect(currentIndex).toBe(0)
    })

    it('should navigate backwards through matches circularly', () => {
        const matches: MatchRange[] = [
            { start: 0, end: 5 },
            { start: 10, end: 15 },
            { start: 20, end: 25 }
        ]
        let currentIndex = 0

        // Prev: 0 -> 2 -> 1 -> 0 (circular backwards)
        currentIndex = navigateToPrevMatch(matches, currentIndex)
        expect(currentIndex).toBe(2)

        currentIndex = navigateToPrevMatch(matches, currentIndex)
        expect(currentIndex).toBe(1)

        currentIndex = navigateToPrevMatch(matches, currentIndex)
        expect(currentIndex).toBe(0)
    })

    it('should handle navigation with empty matches', () => {
        const matches: MatchRange[] = []

        expect(navigateToNextMatch(matches, 0)).toBe(-1)
        expect(navigateToPrevMatch(matches, 0)).toBe(-1)
    })

    it('should find multiple occurrences of the same character', () => {
        const content = 'aaaaaa'
        const searchTerm = 'aa'
        const matches = findAllMatches(content, searchTerm)

        // Overlapping matches: positions 0-1, 1-2, 2-3, 3-4, 4-5
        expect(matches.length).toBe(5)
    })
})

describe('HighlightedTextContent rendering logic', () => {
    it('should count matches correctly for highlighting', () => {
        const content = 'Hello World Hello'
        const searchTerm = 'Hello'
        const matches = findAllMatches(content, searchTerm)

        expect(matches.length).toBe(2)
    })

    it('should handle empty search term', () => {
        const content = 'Hello World'
        const matches = findAllMatches(content, '')

        expect(matches.length).toBe(0)
    })

    it('should handle special regex characters in search term', () => {
        const content = 'Hello. World. Test.'
        const searchTerm = '.'
        const matches = findAllMatches(content, searchTerm)

        // Should find literal dots, not treat as regex (3 dots in the string)
        expect(matches.length).toBe(3)
    })
})
