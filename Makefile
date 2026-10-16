.PHONY: install test build run

install:
	npm ci

test:
	npm run typecheck && npm test

build:
	npm run build

run:
	npm run dev
