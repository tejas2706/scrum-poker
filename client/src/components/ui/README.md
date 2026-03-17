# UI Design System

Professional, enterprise-grade components for Scrum Poker Pro.

## Components

### Typography

```tsx
import { Typography } from '@/components/ui';

<Typography variant="h1">Heading 1</Typography>
<Typography variant="h2">Heading 2</Typography>
<Typography variant="h3">Heading 3</Typography>
<Typography variant="h4">Heading 4</Typography>
<Typography variant="h5">Heading 5</Typography>
<Typography variant="h6">Heading 6</Typography>
<Typography variant="body">Body text</Typography>
<Typography variant="small">Small text</Typography>
<Typography variant="caption">Caption text</Typography>
```

### Button

```tsx
import { Button } from '@/components/ui';

<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>

<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>
```

### Card

```tsx
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui';

<Card>
  <CardHeader>
    <Typography variant="h5">Title</Typography>
  </CardHeader>
  <CardContent>
    Content goes here
  </CardContent>
  <CardFooter>
    Footer content
  </CardFooter>
</Card>
```

### Modal

```tsx
import { Modal, ModalFooter } from '@/components/ui';

const [isOpen, setIsOpen] = useState(false);

<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Modal Title"
>
  Modal content
  <ModalFooter
    onCancel={() => setIsOpen(false)}
    onConfirm={() => setIsOpen(false)}
    confirmLabel="Confirm"
    cancelLabel="Cancel"
  />
</Modal>
```

### Theme Toggle

```tsx
import { ThemeToggle } from '@/components/ui';

<ThemeToggle />
```

## Design Principles

- **Animations**: 150-250ms duration, ease in/out, no bounce
- **Colors**: Neutral slate/zinc/gray palette
- **Dark Mode**: Full support with smooth transitions
- **Accessibility**: Focus states, ARIA labels, keyboard navigation
