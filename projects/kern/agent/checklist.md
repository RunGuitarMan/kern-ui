# KERN agent implementation checklist

## Install

- [ ] Install `@kern-ui/angular` with compatible Angular CDK and Angular Aria peers.
- [ ] Load `@kern-ui/angular/styles/kern.css` exactly once.
- [ ] Use `provideKrn` only for application-owned runtime preferences; zero-config is supported.

## Choose and import

- [ ] Search the component manifest by task and compare related alternatives.
- [ ] Prefer the documented owner entrypoint.
- [ ] Never import from `projects/kern`, `src/lib`, or an undeclared family subpath.

## Implement

- [ ] Import the symbol from its documented owner entrypoint; do not use a deep source import.
- [ ] Load @kern-ui/angular/styles/kern.css exactly once in the application's global styles.
- [ ] Provide every required input and keep collection identities stable across updates.
- [ ] Verify keyboard, focus, visible labels, invalid state, long text, RTL and 200% zoom.
- [ ] Test the consuming SSR/hydration route when server rendering is enabled.
- [ ] Use @kern-ui/angular/testing harnesses when a component-specific harness is available.

## Validate

- [ ] Run the KERN MCP `validate_usage` tool or equivalent static contract check.
- [ ] Compile against the packed npm artifact, not workspace source paths.
- [ ] Exercise the public testing harness for behavior-sensitive components.
