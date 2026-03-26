import type { Meta, StoryObj } from '@storybook/react';
import { Input } from '../web/Input';
import { ShadcnInput } from '../shadcn/ui/input';

const meta = {
  title: 'Web/Input',
  component: Input,
  tags: ['autodocs'],
  args: {
    label: 'Email',
    placeholder: 'you@example.com',
    hint: 'We never share your email.',
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Base: Story = {};

export const Error: Story = {
  args: {
    error: 'Email is required',
    hint: undefined,
  },
};

export const Shadcn: StoryObj = {
  render: () => <ShadcnInput placeholder="you@example.com" />,
};
