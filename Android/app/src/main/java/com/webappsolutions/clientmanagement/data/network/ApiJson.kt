package com.webappsolutions.clientmanagement.data.network

import com.google.gson.JsonArray
import com.google.gson.JsonElement

private fun normalizeJsonKey(value: String): String {
    return value
        .filter { it.isLetterOrDigit() }
        .lowercase()
}

/**
 * Finds a JSON array directly or inside a response wrapper.
 * Supports responses such as:
 * {"data": [...]}
 * {"projects": [...]}
 * {"success": true, "data": {"items": [...]}}
 */
internal fun JsonElement.findArray(
    vararg keys: String
): JsonArray? {

    if (isJsonArray) {
        return asJsonArray
    }

    if (!isJsonObject) {
        return null
    }

    val expectedKeys = keys
        .map { normalizeJsonKey(it) }
        .toSet()

    val jsonObject = asJsonObject

    // Search the expected properties first.
    for ((key, value) in jsonObject.entrySet()) {

        if (normalizeJsonKey(key) in expectedKeys) {

            if (value.isJsonArray) {
                return value.asJsonArray
            }

            val nested = value.findArray(*keys)

            if (nested != null) {
                return nested
            }
        }
    }

    // Search nested objects if necessary.
    for ((_, value) in jsonObject.entrySet()) {

        val nested = value.findArray(*keys)

        if (nested != null) {
            return nested
        }
    }

    return null
}

/**
 * Finds a string or numeric value using alternative field names.
 * Handles snake_case and camelCase fields.
 */
internal fun JsonElement.findString(
    vararg keys: String
): String? {

    if (isJsonObject) {

        val expectedKeys = keys
            .map { normalizeJsonKey(it) }
            .toSet()

        val jsonObject = asJsonObject

        for ((key, value) in jsonObject.entrySet()) {

            if (
                normalizeJsonKey(key) in expectedKeys &&
                value.isJsonPrimitive
            ) {
                val primitive = value.asJsonPrimitive

                if (primitive.isString || primitive.isNumber) {
                    return primitive.asString
                        .takeIf { it.isNotBlank() }
                }
            }
        }

        for ((_, value) in jsonObject.entrySet()) {

            val nested = value.findString(*keys)

            if (!nested.isNullOrBlank()) {
                return nested
            }
        }
    }

    if (isJsonArray) {

        for (value in asJsonArray) {

            val nested = value.findString(*keys)

            if (!nested.isNullOrBlank()) {
                return nested
            }
        }
    }

    return null
}

/**
 * Finds a Boolean value in a JSON response.
 */
internal fun JsonElement.findBoolean(
    vararg keys: String
): Boolean? {

    if (isJsonObject) {

        val expectedKeys = keys
            .map { normalizeJsonKey(it) }
            .toSet()

        val jsonObject = asJsonObject

        for ((key, value) in jsonObject.entrySet()) {

            if (
                normalizeJsonKey(key) in expectedKeys &&
                value.isJsonPrimitive
            ) {
                val primitive = value.asJsonPrimitive

                if (primitive.isBoolean) {
                    return primitive.asBoolean
                }

                if (primitive.isString) {
                    when (primitive.asString.lowercase()) {
                        "true" -> return true
                        "false" -> return false
                    }
                }
            }
        }

        for ((_, value) in jsonObject.entrySet()) {

            val nested = value.findBoolean(*keys)

            if (nested != null) {
                return nested
            }
        }
    }

    if (isJsonArray) {

        for (value in asJsonArray) {

            val nested = value.findBoolean(*keys)

            if (nested != null) {
                return nested
            }
        }
    }

    return null
}