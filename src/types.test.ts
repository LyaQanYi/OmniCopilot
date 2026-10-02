import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { VENDOR_CONFIGS } from "./models.js";
import {
	ALWAYS_THINKING_EFFORT_SCHEMA,
	ALWAYS_THINKING_MODEL_IDS,
	CONTEXT_LENGTH_LIMITS,
	DEEPSEEK_THINKING_EFFORT_SCHEMA,
	DEFAULT_CONTEXT_LENGTH,
	THINKING_EFFORT_NO_LOW_SCHEMA,
	THINKING_EFFORT_SCHEMA,
	THINKING_TOGGLE_SCHEMA,
	applyContextLength,
	toLanguageModelChatInformation,
} from "./types.js";

/** The shape every picker schema in types.ts shares. */
type EffortSchema = {
	properties: { reasoningEffort: { enum: readonly string[]; default: string } };
};

/**
 * The complete set of schemas `toLanguageModelChatInformation` may return. A
 * model resolving to anything else means a branch forgot to assign one.
 */
const KNOWN_SCHEMAS: readonly EffortSchema[] = [
	THINKING_EFFORT_SCHEMA,
	THINKING_EFFORT_NO_LOW_SCHEMA,
	ALWAYS_THINKING_EFFORT_SCHEMA,
	DEEPSEEK_THINKING_EFFORT_SCHEMA,
	THINKING_TOGGLE_SCHEMA,
];

/**
 * Every (vendor, model) pair, flattened. Model ids are intentionally NOT
 * globally unique — Volcengine re-hosts Kimi and GLM under its own endpoint —
 * so vendor context is part of every assertion below.
 */
const ALL_MODELS = VENDOR_CONFIGS.flatMap((vendor) =>
	vendor.models.map((model) => ({ vendor, model })),
);

function schemaOf(
	vendorId: string,
	model: Parameters<typeof toLanguageModelChatInformation>[0],
): EffortSchema | undefined {
	return toLanguageModelChatInformation(model, vendorId)
		.configurationSchema as EffortSchema | undefined;
}

describe("vendor catalog", () => {
	it("registers every vendor under a unique id with an https base URL", () => {
		const ids = VENDOR_CONFIGS.map((v) => v.vendorId);
		assert.ok(ids.length > 0, "no vendors registered");
		assert.equal(
			new Set(ids).size,
			ids.length,
			`duplicate vendorId among: ${ids.join(", ")}`,
		);
		for (const vendor of VENDOR_CONFIGS) {
			assert.ok(vendor.displayName.length > 0, `${vendor.vendorId}: empty displayName`);
			assert.match(
				vendor.defaultBaseUrl,
				/^https:\/\/.+/,
				`${vendor.vendorId}: defaultBaseUrl must be an absolute https URL`,
			);
			assert.ok(
				vendor.models.length > 0,
				`${vendor.vendorId}: registered with no models`,
			);
		}
	});

	it("keeps model ids unique within a vendor", () => {
		for (const vendor of VENDOR_CONFIGS) {
			const ids = vendor.models.map((m) => m.id);
			const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
			assert.deepEqual(
				dupes,
				[],
				`${vendor.vendorId}: duplicate model id(s) ${dupes.join(", ")}`,
			);
		}
	});

	// models.ts is 800+ lines of hand-maintained data checked against vendor
	// docs; a typo here surfaces to users as a broken model in the picker.
	it("has complete, well-formed metadata for every model", () => {
		for (const { vendor, model } of ALL_MODELS) {
			const where = `${vendor.vendorId}/${model.id}`;
			assert.ok(model.id.length > 0, `${where}: empty id`);
			assert.ok(model.name.length > 0, `${where}: empty name`);
			assert.ok(model.family.length > 0, `${where}: empty family`);
			assert.ok(model.version.length > 0, `${where}: empty version`);
			assert.ok(model.tooltip.length > 0, `${where}: empty tooltip`);
			assert.ok(
				Number.isInteger(model.maxInputTokens) && model.maxInputTokens > 0,
				`${where}: maxInputTokens must be a positive integer`,
			);
			assert.ok(
				Number.isInteger(model.maxOutputTokens) && model.maxOutputTokens > 0,
				`${where}: maxOutputTokens must be a positive integer`,
			);
			assert.match(
				model.baseUrl,
				/^https:\/\/.+/,
				`${where}: baseUrl must be an absolute https URL`,
			);
			assert.equal(typeof model.thinking, "boolean", `${where}: thinking must be boolean`);
			assert.equal(
				typeof model.thinkingEffortSupport,
				"boolean",
				`${where}: thinkingEffortSupport must be boolean`,
			);
			assert.equal(
				typeof model.capabilities.imageInput,
				"boolean",
				`${where}: capabilities.imageInput must be boolean`,
			);
			assert.equal(
				typeof model.capabilities.toolCalling,
				"boolean",
				`${where}: capabilities.toolCalling must be boolean`,
			);
		}
	});

	it("marks thinkingLocked only for models that cannot disable thinking", () => {
		for (const { vendor, model } of ALL_MODELS) {
			if (!model.thinkingLocked) continue;
			assert.equal(
				model.thinking,
				true,
				`${vendor.vendorId}/${model.id}: thinkingLocked without thinking: true`,
			);
			assert.equal(
				model.thinkingEffortSupport,
				false,
				`${vendor.vendorId}/${model.id}: thinkingLocked models never expose an effort knob`,
			);
		}
	});
});

describe("toLanguageModelChatInformation", () => {
	it("carries model metadata through to the picker unchanged", () => {
		for (const { vendor, model } of ALL_MODELS) {
			const info = toLanguageModelChatInformation(model, vendor.vendorId);
			const where = `${vendor.vendorId}/${model.id}`;
			assert.equal(info.id, model.id, `${where}: id mismatch`);
			assert.equal(info.name, model.name, `${where}: name mismatch`);
			assert.equal(info.family, model.family, `${where}: family mismatch`);
			assert.equal(info.maxInputTokens, model.maxInputTokens, `${where}: input budget mismatch`);
			assert.equal(info.maxOutputTokens, model.maxOutputTokens, `${where}: output budget mismatch`);
			assert.equal(info.tooltip, model.tooltip, `${where}: tooltip mismatch`);
		}
	});

	it("offers no thinking menu for non-thinking or thinking-locked models", () => {
		for (const { vendor, model } of ALL_MODELS) {
			if (model.thinking && !model.thinkingLocked) continue;
			assert.equal(
				schemaOf(vendor.vendorId, model),
				undefined,
				`${vendor.vendorId}/${model.id} should not expose a thinking menu`,
			);
		}
	});

	it("only ever returns a known schema whose default is inside its own enum", () => {
		for (const { vendor, model } of ALL_MODELS) {
			const schema = schemaOf(vendor.vendorId, model);
			if (!schema) continue;
			const where = `${vendor.vendorId}/${model.id}`;
			assert.ok(
				KNOWN_SCHEMAS.includes(schema),
				`${where}: returned an unregistered thinking schema`,
			);
			const effort = schema.properties.reasoningEffort;
			assert.ok(effort.enum.length > 0, `${where}: empty effort enum`);
			assert.ok(
				effort.enum.includes(effort.default),
				`${where}: default "${effort.default}" is missing from its own enum`,
			);
		}
	});

	/**
	 * The core invariant of the whole extension. The provider re-enables
	 * thinking for every id in ALWAYS_THINKING_MODEL_IDS regardless of what
	 * the user picked, so a "None" entry on such a model is a no-op lie — the
	 * request it produces is byte-identical to "On". This is the check that
	 * stops a newly added always-thinking model from shipping a menu that
	 * silently does nothing, and it fails the moment someone sets
	 * thinkingEffortSupport: false on such a model without also setting
	 * thinkingLocked: true.
	 */
	it("never offers None for a model the endpoints force to think", () => {
		let covered = 0;
		for (const { vendor, model } of ALL_MODELS) {
			if (!ALWAYS_THINKING_MODEL_IDS.has(model.id)) continue;
			covered++;
			const schema = schemaOf(vendor.vendorId, model);
			// No menu at all (thinkingLocked) is the honest outcome.
			if (!schema) continue;
			assert.ok(
				!schema.properties.reasoningEffort.enum.includes("none"),
				`${vendor.vendorId}/${model.id}: always-thinking, but its menu still offers None`,
			);
		}
		assert.ok(covered > 0, "no catalog model is covered by ALWAYS_THINKING_MODEL_IDS");
	});

	/**
	 * ALWAYS_THINKING_MODEL_IDS keys on bare model ids, so the same id can
	 * appear under several vendors with different enforcement needs. Every
	 * listed id must still exist in the catalog, or the provider's always-on
	 * guard has silently gone dead for a model that no longer ships.
	 */
	it("only lists always-thinking ids that still exist in the catalog", () => {
		const catalogIds = new Set(ALL_MODELS.map(({ model }) => model.id));
		const orphans = [...ALWAYS_THINKING_MODEL_IDS].filter((id) => !catalogIds.has(id));
		assert.deepEqual(
			orphans,
			[],
			`ALWAYS_THINKING_MODEL_IDS references unknown model(s): ${orphans.join(", ")}`,
		);
	});
});

describe("applyContextLength", () => {
	it("keeps the model's native limit when set to default", () => {
		assert.equal(applyContextLength(1_000_000, "default", 4096), 1_000_000);
	});

	it("caps at the selected preset", () => {
		assert.equal(applyContextLength(1_000_000, "32k", DEFAULT_CONTEXT_LENGTH), 32_768);
		assert.equal(applyContextLength(1_000_000, "custom", 65_536), 65_536);
	});

	it("never raises a model's native limit", () => {
		assert.equal(applyContextLength(8192, "128k", 1_048_576), 8192);
		assert.equal(applyContextLength(8192, "custom", 1_048_576), 8192);
	});

	it("derives each preset value from its own name", () => {
		for (const [key, limit] of Object.entries(CONTEXT_LENGTH_LIMITS)) {
			const match = /^(\d+)(k|m)$/.exec(key);
			assert.ok(match, `unexpected context length key "${key}"`);
			const [, digits, unit] = match;
			const expected = Number(digits) * (unit === "m" ? 1024 * 1024 : 1024);
			assert.equal(limit, expected, `CONTEXT_LENGTH_LIMITS["${key}"] disagrees with its key`);
		}
	});

	it("exposes presets in strictly ascending order", () => {
		const limits = Object.values(CONTEXT_LENGTH_LIMITS);
		for (let i = 1; i < limits.length; i++) {
			assert.ok(
				limits[i] > limits[i - 1],
				`context presets are not ascending at index ${i} (${limits[i - 1]} → ${limits[i]})`,
			);
		}
	});

	/**
	 * The picker (package.json enum), the status-bar command and
	 * CONTEXT_LENGTH_LIMITS are three hand-maintained lists of the same
	 * choices. This pins the two that live in code to the manifest.
	 */
	it("stays in sync with the omniCopilot.contextLength enum in package.json", () => {
		const manifest = JSON.parse(
			readFileSync(join(__dirname, "..", "package.json"), "utf8"),
		);
		const declared: string[] =
			manifest.contributes.configuration.properties["omniCopilot.contextLength"].enum;
		assert.ok(Array.isArray(declared), "omniCopilot.contextLength has no enum in package.json");

		const implemented = new Set<string>([
			"default",
			"custom",
			...Object.keys(CONTEXT_LENGTH_LIMITS),
		]);
		for (const value of declared) {
			assert.ok(
				implemented.has(value),
				`package.json offers context length "${value}" that types.ts does not implement`,
			);
		}
		for (const value of implemented) {
			assert.ok(
				declared.includes(value),
				`types.ts implements context length "${value}" that package.json does not offer`,
			);
		}
	});
});
