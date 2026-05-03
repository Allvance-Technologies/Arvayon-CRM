import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { Button } from '../../components/common/Button';

import { render, cleanup } from '@testing-library/react';

describe('Button Component Property Tests', () => {
    it('always renders string children text correctly', () => {
        fc.assert(
            fc.property(fc.string(), (text) => {
                if (!text.trim()) return; // Skip empty strings

                const { getByRole } = render(<Button>{text}</Button>);
                const button = getByRole('button');
                expect(button.textContent).toContain(text);
                cleanup();
            })
        );
    });

    it('always applies correct base classes regardless of variant or size', () => {
        fc.assert(
            fc.property(
                fc.constantFrom('primary', 'secondary', 'danger', 'success'),
                fc.constantFrom('sm', 'md', 'lg'),
                fc.boolean(),
                (variant, size, disabled) => {
                    const { getByRole } = render(
                        <Button variant={variant as any} size={size as any} disabled={disabled}>
                            Button Text
                        </Button>
                    );
                    const button = getByRole('button');

                    expect(button.className).toContain('font-medium rounded-lg');
                    if (disabled) {
                        expect(button.className).toContain('opacity-50 cursor-not-allowed');
                    }
                    cleanup();
                }
            )
        );
    });
});
