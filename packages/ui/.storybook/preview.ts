import type { Preview } from '@storybook/react';
import '../src/styles/tailwind.css';
import '../src/styles/theme.css';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'surface',
      values: [
        { name: 'surface', value: '#f7f8fa' },
        { name: 'white', value: '#ffffff' },
      ],
    },
    layout: 'centered',
  },
};

export default preview;
