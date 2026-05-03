import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { Input } from '../../components/common/Input';

describe('Input Component', () => {
    it('renders input element correctly', () => {
        render(<Input placeholder="Enter text" />);
        const input = screen.getByPlaceholderText(/enter text/i);
        expect(input).toBeInTheDocument();
        expect(input).toHaveClass('border-gray-300');
    });

    it('renders with a label', () => {
        render(<Input label="Username" id="username" />);
        const labelText = screen.getByText(/username/i);
        expect(labelText).toBeInTheDocument();
        // Label should be associated with input if id is provided (requires html for in standard usage, but for simple tests we verify text)
    });

    it('displays required asterisk when required prop is true', () => {
        render(<Input label="Email" required />);
        const asterisk = screen.getByText('*');
        expect(asterisk).toBeInTheDocument();
        expect(asterisk).toHaveClass('text-red-500');
    });

    it('displays error message and changes border color', () => {
        render(<Input error="Invalid email address" placeholder="Email" />);
        const errorMessage = screen.getByText(/invalid email address/i);
        expect(errorMessage).toBeInTheDocument();
        expect(errorMessage).toHaveClass('text-red-600');
        
        const input = screen.getByPlaceholderText(/email/i);
        expect(input).toHaveClass('border-red-500');
    });

    it('displays helper text', () => {
        render(<Input helperText="We will never share your email" />);
        const helper = screen.getByText(/we will never share your email/i);
        expect(helper).toBeInTheDocument();
        expect(helper).toHaveClass('text-gray-500');
    });

    it('does not display helper text when there is an error', () => {
        render(<Input helperText="Helper text" error="Error text" />);
        expect(screen.getByText(/error text/i)).toBeInTheDocument();
        expect(screen.queryByText(/helper text/i)).not.toBeInTheDocument();
    });

    it('handles onChange events', () => {
        const handleChange = vi.fn();
        render(<Input placeholder="Type here" onChange={handleChange} />);
        
        const input = screen.getByPlaceholderText(/type here/i);
        fireEvent.change(input, { target: { value: 'New text' } });
        
        expect(handleChange).toHaveBeenCalledTimes(1);
    });

    it('forwards ref correctly', () => {
        const ref = React.createRef<HTMLInputElement>();
        render(<Input ref={ref} />);
        expect(ref.current).toBeInstanceOf(HTMLInputElement);
    });
});
