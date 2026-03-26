import type { Meta, StoryObj } from '@storybook/react';
import { Modal } from '../web/Modal';
import { ShadcnModal } from '../shadcn';

const meta = {
  title: 'Web/Modal',
  component: Modal,
  tags: ['autodocs'],
  args: {
    open: true,
    title: 'Confirm action',
    children: 'Are you sure you want to continue?',
    onClose: () => undefined,
    onConfirm: () => undefined,
  },
} satisfies Meta<typeof Modal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Base: Story = {};

export const Shadcn: StoryObj = {
  render: () => (
    <ShadcnModal open title="Confirm action" onClose={() => undefined} onConfirm={() => undefined}>
      Are you sure you want to continue?
    </ShadcnModal>
  ),
};
