package com.webappsolutions.clientmanagement.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.google.gson.JsonElement
import com.google.gson.JsonObject
import com.webappsolutions.clientmanagement.data.network.ApiClient
import com.webappsolutions.clientmanagement.navigation.AppRoutes
import com.webappsolutions.clientmanagement.ui.components.AppBottomNavigation
import kotlinx.coroutines.launch

private fun findSettingsObject(
    element: JsonElement?
): JsonObject? {

    if (element == null || element.isJsonNull) {
        return null
    }

    if (element.isJsonObject) {
        val objectValue = element.asJsonObject

        val looksLikeSettings =
            objectValue.has("theme") ||
                    objectValue.has("notifications_enabled") ||
                    objectValue.has("email_notifications") ||
                    objectValue.has("compact_mode")

        if (looksLikeSettings) {
            return objectValue
        }

        for ((_, child) in objectValue.entrySet()) {
            val result = findSettingsObject(child)

            if (result != null) {
                return result
            }
        }
    }

    if (element.isJsonArray) {
        for (child in element.asJsonArray) {
            val result = findSettingsObject(child)

            if (result != null) {
                return result
            }
        }
    }

    return null
}

private fun JsonObject.getStringValue(
    key: String,
    defaultValue: String
): String {
    val value = get(key)

    return if (value != null && !value.isJsonNull) {
        value.asString
    } else {
        defaultValue
    }
}

private fun JsonObject.getBooleanValue(
    key: String,
    defaultValue: Boolean
): Boolean {
    val value = get(key)

    return if (value != null && !value.isJsonNull) {
        value.asBoolean
    } else {
        defaultValue
    }
}

@Composable
fun SettingsScreen(
    onNavigate: (String) -> Unit
) {
    var theme by remember {
        mutableStateOf("system")
    }

    var notificationsEnabled by remember {
        mutableStateOf(true)
    }

    var emailNotifications by remember {
        mutableStateOf(true)
    }

    var compactMode by remember {
        mutableStateOf(false)
    }

    var isLoading by remember {
        mutableStateOf(true)
    }

    var isSaving by remember {
        mutableStateOf(false)
    }

    var errorMessage by remember {
        mutableStateOf<String?>(null)
    }

    var successMessage by remember {
        mutableStateOf<String?>(null)
    }

    val coroutineScope = rememberCoroutineScope()

    LaunchedEffect(Unit) {

        isLoading = true
        errorMessage = null

        try {
            val response = ApiClient.service.getUserSettings()

            if (!response.isSuccessful) {
                errorMessage =
                    "Unable to load settings. Server returned ${response.code()}."
            } else {

                val settings = findSettingsObject(response.body())

                if (settings != null) {
                    theme = settings.getStringValue(
                        "theme",
                        "system"
                    )

                    notificationsEnabled =
                        settings.getBooleanValue(
                            "notifications_enabled",
                            true
                        )

                    emailNotifications =
                        settings.getBooleanValue(
                            "email_notifications",
                            true
                        )

                    compactMode =
                        settings.getBooleanValue(
                            "compact_mode",
                            false
                        )
                } else {
                    errorMessage =
                        "Settings data could not be read."
                }
            }

        } catch (exception: Exception) {

            errorMessage =
                exception.message
                    ?: "Unable to connect to the API."

        } finally {
            isLoading = false
        }
    }

    Scaffold(
        bottomBar = {
            NavigationBar {
                AppBottomNavigation(
                    currentRoute = AppRoutes.SETTINGS,
                    onNavigate = onNavigate
                )
            }
        }
    ) { paddingValues ->

        if (isLoading) {

            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
            ) {

                CircularProgressIndicator()

                Spacer(
                    modifier = Modifier.height(16.dp)
                )

                Text(
                    text = "Loading settings..."
                )
            }

        } else {

            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues)
                    .padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {

                item {

                    Text(
                        text = "Settings",
                        style = MaterialTheme.typography.headlineMedium
                    )

                    Spacer(
                        modifier = Modifier.height(4.dp)
                    )

                    Text(
                        text = "Manage your application preferences.",
                        style = MaterialTheme.typography.bodyMedium
                    )
                }

                if (errorMessage != null) {

                    item {

                        Card(
                            modifier = Modifier.fillMaxWidth()
                        ) {

                            Text(
                                text = errorMessage!!,
                                modifier = Modifier.padding(16.dp),
                                color = MaterialTheme.colorScheme.error
                            )
                        }
                    }
                }

                if (successMessage != null) {

                    item {

                        Card(
                            modifier = Modifier.fillMaxWidth()
                        ) {

                            Text(
                                text = successMessage!!,
                                modifier = Modifier.padding(16.dp)
                            )
                        }
                    }
                }

                item {

                    Card(
                        modifier = Modifier.fillMaxWidth()
                    ) {

                        Column(
                            modifier = Modifier.padding(16.dp)
                        ) {

                            Text(
                                text = "Appearance",
                                style = MaterialTheme.typography.titleLarge
                            )

                            Spacer(
                                modifier = Modifier.height(12.dp)
                            )

                            Text(
                                text = "Theme",
                                style = MaterialTheme.typography.titleMedium
                            )

                            Spacer(
                                modifier = Modifier.height(8.dp)
                            )

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement =
                                    Arrangement.spacedBy(8.dp)
                            ) {

                                OutlinedButton(
                                    onClick = {
                                        theme = "light"
                                    }
                                ) {
                                    Text("Light")
                                }

                                OutlinedButton(
                                    onClick = {
                                        theme = "dark"
                                    }
                                ) {
                                    Text("Dark")
                                }

                                OutlinedButton(
                                    onClick = {
                                        theme = "system"
                                    }
                                ) {
                                    Text("System")
                                }
                            }

                            Spacer(
                                modifier = Modifier.height(8.dp)
                            )

                            Text(
                                text = "Current theme: ${
                                    theme.replaceFirstChar {
                                        it.uppercase()
                                    }
                                }",
                                style = MaterialTheme.typography.bodyMedium
                            )
                        }
                    }
                }

                item {

                    Card(
                        modifier = Modifier.fillMaxWidth()
                    ) {

                        Column(
                            modifier = Modifier.padding(16.dp)
                        ) {

                            Text(
                                text = "Notifications",
                                style = MaterialTheme.typography.titleLarge
                            )

                            Spacer(
                                modifier = Modifier.height(12.dp)
                            )

                            SettingSwitchRow(
                                title = "Enable notifications",
                                description =
                                    "Receive application notifications.",
                                checked = notificationsEnabled,
                                onCheckedChange = {
                                    notificationsEnabled = it
                                }
                            )

                            Spacer(
                                modifier = Modifier.height(12.dp)
                            )

                            SettingSwitchRow(
                                title = "Email notifications",
                                description =
                                    "Receive notifications by email.",
                                checked = emailNotifications,
                                onCheckedChange = {
                                    emailNotifications = it
                                }
                            )
                        }
                    }
                }

                item {

                    Card(
                        modifier = Modifier.fillMaxWidth()
                    ) {

                        Column(
                            modifier = Modifier.padding(16.dp)
                        ) {

                            Text(
                                text = "Display",
                                style = MaterialTheme.typography.titleLarge
                            )

                            Spacer(
                                modifier = Modifier.height(12.dp)
                            )

                            SettingSwitchRow(
                                title = "Compact mode",
                                description =
                                    "Use a more compact application layout.",
                                checked = compactMode,
                                onCheckedChange = {
                                    compactMode = it
                                }
                            )
                        }
                    }
                }

                item {

                    Card(
                        modifier = Modifier.fillMaxWidth()
                    ) {

                        Column(
                            modifier = Modifier.padding(16.dp)
                        ) {

                            Text(
                                text = "Language",
                                style = MaterialTheme.typography.titleLarge
                            )

                            Spacer(
                                modifier = Modifier.height(8.dp)
                            )

                            Text(
                                text = "English",
                                style = MaterialTheme.typography.bodyLarge
                            )

                            Spacer(
                                modifier = Modifier.height(4.dp)
                            )

                            Text(
                                text = "English is currently the supported application language.",
                                style = MaterialTheme.typography.bodyMedium
                            )
                        }
                    }
                }

                item {

                    Button(
                        modifier = Modifier.fillMaxWidth(),
                        enabled = !isSaving,
                        onClick = {

                            coroutineScope.launch {

                                isSaving = true
                                errorMessage = null
                                successMessage = null

                                try {

                                    val requestBody =
                                        JsonObject().apply {

                                            addProperty(
                                                "theme",
                                                theme
                                            )

                                            addProperty(
                                                "notifications_enabled",
                                                notificationsEnabled
                                            )

                                            addProperty(
                                                "email_notifications",
                                                emailNotifications
                                            )

                                            addProperty(
                                                "language",
                                                "en"
                                            )

                                            addProperty(
                                                "compact_mode",
                                                compactMode
                                            )
                                        }

                                    val response =
                                        ApiClient.service
                                            .updateUserSettings(
                                                requestBody
                                            )

                                    if (response.isSuccessful) {

                                        successMessage =
                                            "Settings saved successfully."

                                    } else {

                                        errorMessage =
                                            "Unable to save settings. Server returned ${response.code()}."
                                    }

                                } catch (exception: Exception) {

                                    errorMessage =
                                        exception.message
                                            ?: "Unable to connect to the API."

                                } finally {

                                    isSaving = false
                                }
                            }
                        }
                    ) {

                        Text(
                            text = if (isSaving) {
                                "Saving..."
                            } else {
                                "Save Settings"
                            }
                        )
                    }
                }

                item {

                    Spacer(
                        modifier = Modifier.height(8.dp)
                    )

                    Text(
                        text = "Client Management & Project Tracking System",
                        style = MaterialTheme.typography.bodySmall
                    )
                }
            }
        }
    }
}

@Composable
private fun SettingSwitchRow(
    title: String,
    description: String,
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit
) {

    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically
    ) {

        Column(
            modifier = Modifier.weight(1f)
        ) {

            Text(
                text = title,
                style = MaterialTheme.typography.titleMedium
            )

            Spacer(
                modifier = Modifier.height(2.dp)
            )

            Text(
                text = description,
                style = MaterialTheme.typography.bodySmall
            )
        }

        Switch(
            checked = checked,
            onCheckedChange = onCheckedChange
        )
    }
}