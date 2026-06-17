# Contributing to Back2You

We love your input! We want to make contributing to Back2You as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features
- Becoming a maintainer

## Development Process

We use GitHub to host code, to track issues and feature requests, as well as accept pull requests.

### Pull Requests Process

1. Fork the repo and create your branch from `main`.
2. If you've added code that should be tested, add tests.
3. If you've changed APIs, update the documentation.
4. Ensure the test suite passes.
5. Make sure your code lints.
6. Issue that pull request!

### Branch Naming Convention

- `feature/description` - for new features
- `bugfix/description` - for bug fixes
- `hotfix/description` - for critical fixes
- `chore/description` - for maintenance tasks

## Code Style Guidelines

### Backend (Node.js)
- Use ES6+ features
- Follow ESLint configuration
- Use meaningful variable and function names
- Add JSDoc comments for functions
- Handle errors properly with try-catch blocks

### Frontend (React)
- Use functional components with hooks
- Follow component naming conventions (PascalCase)
- Use Tailwind CSS classes consistently
- Implement proper error boundaries
- Use TypeScript when possible

### Database
- Use parameterized queries to prevent SQL injection
- Follow proper naming conventions for tables and columns
- Add proper indexes for performance
- Document schema changes

## Commit Message Format

Use the conventional commit format:

```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to the build process or auxiliary tools

Examples:
```
feat(auth): add password reset functionality
fix(api): resolve user profile update issue
docs(readme): update installation instructions
```

## Testing Guidelines

### Backend Testing
- Write unit tests for all service functions
- Add integration tests for API endpoints
- Use Jest as the testing framework
- Aim for at least 80% code coverage

### Frontend Testing
- Write component tests using React Testing Library
- Add E2E tests for critical user flows
- Test responsive design on multiple screen sizes
- Verify accessibility standards

## Bug Reports

We use GitHub issues to track public bugs. Report a bug by [opening a new issue](https://github.com/NandiniSharma2-2/Back2You/issues).

**Great Bug Reports** tend to have:

- A quick summary and/or background
- Steps to reproduce
  - Be specific!
  - Give sample code if you can
- What you expected would happen
- What actually happens
- Notes (possibly including why you think this might be happening, or stuff you tried that didn't work)

## Feature Requests

Feature requests are welcome! Please provide:

- **Use case**: Describe the problem you're trying to solve
- **Proposed solution**: How you think it should work
- **Alternatives**: Any alternative solutions you've considered
- **Additional context**: Screenshots, mockups, or examples

## Development Setup

### Prerequisites
- Node.js 16+
- MySQL 8.0+
- Git

### Setup Steps
1. Clone your fork: `git clone https://github.com/yourusername/Back2You.git`
2. Install dependencies: `npm install` (in both backend and frontend directories)
3. Set up environment variables (see README.md)
4. Run database migrations: `npm run migrate`
5. Start development servers: `npm run dev`

### Testing
```bash
# Backend tests
cd backend && npm test

# Frontend tests  
cd frontend && npm test

# E2E tests
npm run test:e2e
```

## Code of Conduct

### Our Pledge

We pledge to make participation in our project a harassment-free experience for everyone, regardless of age, body size, disability, ethnicity, sex characteristics, gender identity and expression, level of experience, education, socio-economic status, nationality, personal appearance, race, religion, or sexual identity and orientation.

### Our Standards

Examples of behavior that contributes to creating a positive environment include:

- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

### Enforcement

Project maintainers are responsible for clarifying the standards of acceptable behavior and are expected to take appropriate and fair corrective action in response to any instances of unacceptable behavior.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Questions?

Don't hesitate to reach out if you have questions:
- Open an issue with the `question` label
- Contact the maintainers directly

Thank you for contributing to Back2You! 🚀