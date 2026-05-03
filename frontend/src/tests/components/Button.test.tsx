import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../../components/common/Button';


describe('Button Component', () => {
    it('renders correctly with default props', () => {
        render(<Button>Click Me</Button>);
        const button = screen.getByRole('button', { name: /click me/i });
        expect(button).toBeDefined();
        // Since we are not using jest-dom matchers, standard vitest expect works
        expect(button.className).toContain('bg-blue-600');
    });

    it('handles secondary variant correctly', () => {
        render(<Button variant="secondary">Secondary</Button>);
        const button = screen.getByRole('button', { name: /secondary/i });
        expect(button.className).toContain('bg-gray-200');
    });

    it('handles danger variant correctly', () => {
        render(<Button variant="danger">Delete</Button>);
        const button = screen.getByRole('button', { name: /delete/i });
        expect(button.className).toContain('bg-red-600');
    });

    it('fires onClick event when clicked', () => {
        const handleClick = vi.fn();
        render(<Button onClick={handleClick}>Clickable</Button>);

        const button = screen.getByRole('button', { name: /clickable/i });
        fireEvent.click(button);

        expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('is disabled when disabled prop is true', () => {
        render(<Button disabled>Disabled</Button>);
        const button = screen.getByRole('button', { name: /disabled/i }) as HTMLButtonElement;
        expect(button.disabled).toBe(true);
        expect(button.className).toContain('opacity-50');
    });
});
