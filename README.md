# Tab to Work

Goal-aware tab intelligence: save tabs with content, classify by goals, chat with your research.

## Extension (Chrome + Safari)

```bash
cd extension
# Chrome: chrome://extensions → Load unpacked → select extension/
# Safari: ./scripts/build-safari.sh (requires Xcode)
```

See [extension/README.md](extension/README.md).

## Landing page

Static site preview:

```bash
python3 -m http.server 8080
```

Visit http://localhost:8080

## Docs

- [Product requirements](docs/PRD.md)
- [Decisions](DECISIONS.md)
- [Explainer video](videos/tab-to-work-explainer/)

