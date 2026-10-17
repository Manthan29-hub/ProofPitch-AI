.PHONY: install test build run

install:
	npm ci

test:
	npm run typecheck && npm test && npm run test:frontend

build:
	npm run build

run:
	npm run dev
