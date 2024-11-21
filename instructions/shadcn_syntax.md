To set up a Next.js project using Shadcn, follow these steps based on the official documentation:

### 1. Create a New Project

Run the following command to create a new Next.js project or to set up an existing one:

```bash
npx shadcn@latest init
```

If you want to use default settings, you can include the `-d` flag:

```bash
npx shadcn@latest init -d
```

This will set defaults such as the style (`new-york`) and color (`zinc`), along with options for CSS variables.

### 2. Configure `components.json`

During the initialization, you will be prompted with several questions to configure your `components.json` file:

```
Which style would you like to use? › New York
Which color would you like to use as base color? › Zinc
Do you want to use CSS variables for colors? › no / yes
```

### 3. Adding Components

Once your project is configured, you can start adding components. For example, to add a Button component, run:

```bash
npx shadcn@latest add button
```

### 4. Importing Components

After adding a component, you can import and use it in your application like this:

```jsx
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div>
      <Button>Click me</Button>
    </div>
  );
}
```

### Conclusion

With these steps, you can effectively set up and start building your Next.js application using Shadcn components. For further details and updates, refer directly to the [Shadcn Documentation](https://ui.shadcn.com/docs/installation/next).

Citations:
[1] https://ui.shadcn.com/docs/installation/next
