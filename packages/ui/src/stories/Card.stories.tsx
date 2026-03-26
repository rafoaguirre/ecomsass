import type { Meta, StoryObj } from '@storybook/react';
import { Card } from '../web/Card';
import {
  ShadcnCard,
  ShadcnCardContent,
  ShadcnCardDescription,
  ShadcnCardHeader,
  ShadcnCardTitle,
} from '../shadcn';

const meta = {
  title: 'Web/Card',
  component: Card,
  tags: ['autodocs'],
  args: {
    title: 'Featured Product',
    subtitle: 'Focused UI card for merchandising',
    children: 'Product content goes here.',
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Base: Story = {};

export const Shadcn: StoryObj = {
  render: () => (
    <ShadcnCard className="w-[360px]">
      <ShadcnCardHeader>
        <ShadcnCardTitle>Featured Product</ShadcnCardTitle>
        <ShadcnCardDescription>Focused UI card for merchandising</ShadcnCardDescription>
      </ShadcnCardHeader>
      <ShadcnCardContent>Product content goes here.</ShadcnCardContent>
    </ShadcnCard>
  ),
};
