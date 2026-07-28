# Contributing

Thanks for helping maintain the Moroccan AI Education Catalog.

## Add or update a program

1. Edit `catalog/programs.json`.
2. Use an official source whenever possible.
3. Fill the source fields directly in the same row.
4. Use English names for programs, cities, regions, institutions, and notes when possible.
5. Update `last_checked`.
6. Run:

```bash
python scripts/validate_catalog.py
```

## Add or update a research structure

Edit `catalog/research_structures.json` for labs, doctoral formations, research centers, and AI research groups.

## Pull request checklist

- [ ] The entry is in Morocco
- [ ] It is clearly related to AI, data science, ML, Big Data, or AI research
- [ ] The source URL is official or marked appropriately
- [ ] The source fields are filled in the same JSON entry
- [ ] The status is correct
- [ ] `last_checked` is updated
- [ ] `python scripts/validate_catalog.py` passes
