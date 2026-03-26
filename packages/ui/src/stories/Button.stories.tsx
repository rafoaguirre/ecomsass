import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '../web/Button';
import { ShadcnButton } from '../shadcn/ui/button';

const meta = {
  title: 'Web/Button',
  component: Button,
  tags: ['autodocs'],
  args: {
    children: 'Buy now',
    size: 'md',
    variant: 'primary',
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Base: Story = {};

export const Secondary: Story = {
  args: { variant: 'secondary', children: 'Preview' },
};

export const Ghost: Story = {
  args: { variant: 'ghost', children: 'Dismiss' },
};

export const Shadcn: StoryObj = {
  render: () => <ShadcnButton>Shadcn Button</ShadcnButton>,
};
