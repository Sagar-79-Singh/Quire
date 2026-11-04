# Contributing to Quire

Quire is maintained by Sagar. Contributions are welcome through GitHub issues and pull requests.

## Ground rules

- Keep the runtime entirely offline. No telemetry, accounts, cloud calls, or remote assets.
- Use original Quire SVG icons. Do not add proprietary office-suite trademarks, logos, copied icons, or bundled proprietary fonts.
- Writer is the only active app. Future apps remain registry entries marked ComingSoon.
- Keep the renderer sandboxed. All privileged work goes through the typed `window.quire` bridge and validated IPC handlers.
- Put user-facing strings in `src/i18n/en.ts`. Keep shell state and Writer state separate.
- Match the existing strict TypeScript style. Do not add `ts-ignore`, `eslint-disable`, or disabled tests to make CI pass.

## Development

Requirements: Node.js 20.19 or newer and npm.

```bash
npm ci
npm run dev
```

The renderer-only preview is available with `npm run dev:web`. The desktop app requires Electron to be installed normally (do not skip the Electron binary download in CI).

## Checks

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run test:e2e
```

Unit tests use Vitest, Testing Library, and jsdom. End-to-end tests use Playwright with the packaged Electron main process. Coverage thresholds are 80% lines/functions/statements and 70% branches.

## Pull requests

1. Branch from `main`.
2. Keep changes focused and include matching tests for each module.
3. Ensure all checks pass in GitHub Actions.
4. Describe the user-visible change and any file-format compatibility impact.

## Releases

Only the `v1.0.0` tag (or a manual workflow dispatch) triggers the release workflow. Intermediate branch pushes never build installers. The release job runs the test gate first, then builds Windows, Linux, and macOS artifacts and attaches them to the GitHub release.

## License

By contributing, you agree that your contributions are licensed under the MIT license. Copyright remains with their authors; the project license text names Sagar as the original copyright holder.
