import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from '../../components/common/Badge';

describe('Badge Component', () => {
    it('renders correctly with default props', () => {
        render(<Badge>Default Badge</Badge>);
        const badge = screen.getByText(/default badge/i);
        expect(badge).toBeDefined();
        expect(badge.className).toContain('bg-gray-100');
        expect(badge.className).toContain('text-gray-800');
        expect(badge.className).toContain('px-2.5'); // md size
    });

    it('handles success variant correctly', () => {
        render(<Badge variant="success">Success</Badge>);
        const badge = screen.getByText(/success/i);
        expect(badge.className).toContain('bg-green-100');
        expect(badge.className).toContain('text-green-800');
    });

    it('handles warning variant correctly', () => {
        render(<Badge variant="warning">Warning</Badge>);
        const badge = screen.getByText(/warning/i);
        expect(badge.className).toContain('bg-yellow-100');
        expect(badge.className).toContain('text-yellow-800');
    });

    it('handles danger variant correctly', () => {
        render(<Badge variant="danger">Danger</Badge>);
        const badge = screen.getByText(/danger/i);
        expect(badge.className).toContain('bg-red-100');
        expect(badge.className).toContain('text-red-800');
    });

    it('handles info variant correctly', () => {
        render(<Badge variant="info">Info</Badge>);
        const badge = screen.getByText(/info/i);
        expect(badge.className).toContain('bg-blue-100');
        expect(badge.className).toContain('text-blue-800');
    });

    it('handles sm size correctly', () => {
        render(<Badge size="sm">Small</Badge>);
        const badge = screen.getByText(/small/i);
        expect(badge.className).toContain('px-2 py-0.5 text-xs');
    });
});
