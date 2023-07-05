install:
	@ npm ci

install-updates:
	@ npm install

list-outdated: install
	@ npm outdated

lint-check:
	@ node scripts/linting/run.js --config-modifier ./eslintrc-modifier.js

lint-check-ci:
	@ node scripts/linting/run.js --config-modifier ./eslintrc-modifier.js --output-file lint-check-results.json --output-file-format annotations

lint-fix:
	@ node scripts/linting/run.js --config-modifier ./eslintrc-modifier.js --fix

type-check:
	@ echo "Not Supported"

type-check-ci:
	@ echo "Not Supported"

security-check:
	@ # NOTE(krishan711): maybe use npm audit
	@ echo "Not Supported"

security-check-ci:
	@ echo "Not Supported"

build:
	@ echo "Not Supported"

build-ssr:
	@ echo "Not Supported"

build-static:
	@ echo "Not Supported"

start:
	@ echo "Not Supported"

start-prod:
	@ echo "Not Supported"

test:
	@ echo "Not Supported"

publish:
	@ npm publish

publish-next:
ifneq ($(COMMIT_COUNT),0)
	node scripts/publish/run.js --next --next-version $(COMMIT_COUNT)
endif

clean:
	@ rm -rf ./node_modules ./package-lock.json ./build ./dist

.PHONY: *
