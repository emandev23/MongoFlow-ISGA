# Contributing to MongoFlow

Thank you for your interest in contributing to MongoFlow! This document provides guidelines and instructions for contributing.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/MongoFlow.git`
3. Create a branch: `git checkout -b feature/your-feature-name`
4. Install dependencies: `npm install`
5. Make your changes
6. Test your changes: `npm run dev`
7. Commit your changes: `git commit -m 'Add some feature'`
8. Push to your branch: `git push origin feature/your-feature-name`
9. Open a Pull Request

## Development Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- MongoDB instance (for testing)

### Environment Variables

Create a `.env.local` file:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### Running the Development Server

```bash
npm run dev
```

## Code Style

- Use TypeScript for all new code
- Follow the existing code style
- Use meaningful variable and function names
- Add comments for complex logic
- Keep components focused and reusable

## Project Structure

- `app/` - Next.js app directory with pages and API routes
- `components/` - React components
- `lib/` - Utility functions and helpers
- `store/` - Zustand state management stores
- `types/` - TypeScript type definitions

## Commit Messages

Use clear, descriptive commit messages:

- `feat: Add new feature`
- `fix: Fix bug in X`
- `docs: Update documentation`
- `style: Format code`
- `refactor: Refactor component`
- `test: Add tests`
- `chore: Update dependencies`

## Pull Request Process

1. Ensure your code follows the project's style guidelines
2. Update documentation if needed
3. Test your changes thoroughly
4. Create a clear PR description
5. Link any related issues

## Reporting Issues

When reporting issues, please include:

- Description of the issue
- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots (if applicable)
- Environment details (OS, Node version, etc.)

## Feature Requests

For feature requests, please:

- Check if the feature already exists
- Explain the use case
- Describe the expected behavior
- Consider implementation complexity

## Questions?

Feel free to open an issue for any questions or concerns.

Thank you for contributing! 🎉

