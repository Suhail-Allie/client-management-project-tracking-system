package com.webappsolutions.clientmanagement.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ElevatedCard
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.google.gson.JsonArray
import com.google.gson.JsonElement
import com.google.gson.JsonObject
import com.webappsolutions.clientmanagement.data.network.ApiClient
import com.webappsolutions.clientmanagement.navigation.AppRoutes
import com.webappsolutions.clientmanagement.ui.components.AppBottomNavigation
import kotlinx.coroutines.launch

private data class NotificationItem(
    val id: String,
    val title: String,
    val message: String,
    val type: String,
    val isRead: Boolean
)

@Composable
fun NotificationsScreen(
    onNavigate: (String) -> Unit
) {
    var notifications by remember {
        mutableStateOf<List<NotificationItem>>(emptyList())
    }

    var isLoading by remember {
        mutableStateOf(true)
    }

    var errorMessage by remember {
        mutableStateOf<String?>(null)
    }

    var updatingIds by remember {
        mutableStateOf<Set<String>>(emptySet())
    }

    val scope = rememberCoroutineScope()

    suspend fun loadNotifications() {
        isLoading = true
        errorMessage = null

        try {
            val response = ApiClient.service.getNotifications()

            if (response.isSuccessful) {
                notifications = parseNotifications(response.body())
            } else {
                errorMessage =
                    "Unable to load notifications. HTTP ${response.code()}."
            }
        } catch (exception: Exception) {
            errorMessage = exception.message
                ?: "Unable to connect to the server."
        } finally {
            isLoading = false
        }
    }

    suspend fun markAsRead(notification: NotificationItem) {
        if (notification.isRead ||
            notification.id in updatingIds
        ) {
            return
        }

        updatingIds = updatingIds + notification.id

        try {
            val body = JsonObject().apply {
                addProperty("is_read", true)
            }

            val response = ApiClient.service.updateNotification(
                id = notification.id,
                body = body
            )

            if (response.isSuccessful) {
                notifications = notifications.map { item ->
                    if (item.id == notification.id) {
                        item.copy(isRead = true)
                    } else {
                        item
                    }
                }

                errorMessage = null
            } else {
                errorMessage =
                    "Could not update notification. HTTP ${response.code()}."
            }
        } catch (exception: Exception) {
            errorMessage = exception.message
                ?: "Unable to update the notification."
        } finally {
            updatingIds = updatingIds - notification.id
        }
    }

    LaunchedEffect(Unit) {
        loadNotifications()
    }

    Scaffold(
        bottomBar = {
            AppBottomNavigation(
                currentRoute = AppRoutes.NOTIFICATIONS,
                onNavigate = onNavigate
            )
        }
    ) { innerPadding ->

        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(16.dp)
        ) {

            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(
                    modifier = Modifier.weight(1f)
                ) {
                    Text(
                        text = "Notifications",
                        style = MaterialTheme.typography.headlineMedium,
                        fontWeight = FontWeight.Bold
                    )

                    Text(
                        text = "Your project and system updates",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                OutlinedButton(
                    onClick = {
                        scope.launch {
                            loadNotifications()
                        }
                    },
                    enabled = !isLoading
                ) {
                    Text("Refresh")
                }
            }

            Spacer(modifier = Modifier.padding(top = 12.dp))

            if (errorMessage != null) {
                Text(
                    text = errorMessage!!,
                    color = MaterialTheme.colorScheme.error,
                    style = MaterialTheme.typography.bodyMedium,
                    modifier = Modifier.padding(bottom = 12.dp)
                )
            }

            when {
                isLoading -> {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .weight(1f),
                        contentAlignment = Alignment.Center
                    ) {
                        CircularProgressIndicator()
                    }
                }

                notifications.isEmpty() -> {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .weight(1f),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Text(
                                text = "You're all caught up",
                                style = MaterialTheme.typography.titleMedium
                            )

                            Spacer(modifier = Modifier.padding(top = 4.dp))

                            Text(
                                text = "No notifications were found.",
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }

                else -> {
                    LazyColumn(
                        modifier = Modifier.weight(1f),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        items(
                            items = notifications,
                            key = { it.id }
                        ) { notification ->

                            ElevatedCard(
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Column(
                                    modifier = Modifier.padding(16.dp)
                                ) {

                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Text(
                                            text = notification.title,
                                            modifier = Modifier.weight(1f),
                                            style = MaterialTheme.typography.titleMedium,
                                            fontWeight = if (notification.isRead) {
                                                FontWeight.Normal
                                            } else {
                                                FontWeight.Bold
                                            }
                                        )

                                        Text(
                                            text = if (notification.isRead) {
                                                "Read"
                                            } else {
                                                "Unread"
                                            },
                                            color = if (notification.isRead) {
                                                MaterialTheme.colorScheme.onSurfaceVariant
                                            } else {
                                                MaterialTheme.colorScheme.primary
                                            },
                                            style = MaterialTheme.typography.labelMedium
                                        )
                                    }

                                    Spacer(
                                        modifier = Modifier.padding(top = 6.dp)
                                    )

                                    Text(
                                        text = notification.message,
                                        style = MaterialTheme.typography.bodyMedium
                                    )

                                    Spacer(
                                        modifier = Modifier.padding(top = 8.dp)
                                    )

                                    Text(
                                        text = notification.type
                                            .replaceFirstChar { it.uppercase() },
                                        style = MaterialTheme.typography.labelSmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )

                                    if (!notification.isRead) {
                                        Spacer(
                                            modifier = Modifier.padding(top = 8.dp)
                                        )

                                        Button(
                                            onClick = {
                                                scope.launch {
                                                    markAsRead(notification)
                                                }
                                            },
                                            enabled = notification.id !in updatingIds
                                        ) {
                                            Text(
                                                text = if (
                                                    notification.id in updatingIds
                                                ) {
                                                    "Updating..."
                                                } else {
                                                    "Mark as read"
                                                }
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

private fun parseNotifications(
    root: JsonElement?
): List<NotificationItem> {

    val array = findNotificationArray(root)
        ?: return emptyList()

    return array.mapNotNull { element ->

        if (!element.isJsonObject) {
            return@mapNotNull null
        }

        val id = findJsonString(
            element,
            "id",
            "notification_id"
        ) ?: return@mapNotNull null

        NotificationItem(
            id = id,
            title = findJsonString(
                element,
                "title"
            ) ?: "Notification",

            message = findJsonString(
                element,
                "message",
                "body"
            ) ?: "",

            type = findJsonString(
                element,
                "type"
            ) ?: "general",

            isRead = findJsonBoolean(
                element,
                "is_read",
                "isRead"
            ) ?: false
        )
    }
}

private fun findNotificationArray(
    element: JsonElement?
): JsonArray? {

    if (element == null || element.isJsonNull) {
        return null
    }

    if (element.isJsonArray) {
        return element.asJsonArray
    }

    if (!element.isJsonObject) {
        return null
    }

    val objectValue = element.asJsonObject

    val preferredKeys = listOf(
        "notifications",
        "data",
        "items",
        "results"
    )

    for (key in preferredKeys) {
        if (objectValue.has(key)) {
            val result = findNotificationArray(
                objectValue.get(key)
            )

            if (result != null) {
                return result
            }
        }
    }

    for ((_, value) in objectValue.entrySet()) {
        val result = findNotificationArray(value)

        if (result != null) {
            return result
        }
    }

    return null
}

private fun findJsonString(
    element: JsonElement,
    vararg keys: String
): String? {

    if (element.isJsonObject) {
        val objectValue = element.asJsonObject

        for (key in keys) {
            val value = objectValue.get(key)

            if (
                value != null &&
                !value.isJsonNull &&
                value.isJsonPrimitive
            ) {
                return try {
                    value.asString
                } catch (_: Exception) {
                    null
                }
            }
        }

        for ((_, value) in objectValue.entrySet()) {
            val result = findJsonString(value, *keys)

            if (result != null) {
                return result
            }
        }
    }

    if (element.isJsonArray) {
        for (value in element.asJsonArray) {
            val result = findJsonString(value, *keys)

            if (result != null) {
                return result
            }
        }
    }

    return null
}

private fun findJsonBoolean(
    element: JsonElement,
    vararg keys: String
): Boolean? {

    if (element.isJsonObject) {
        val objectValue = element.asJsonObject

        for (key in keys) {
            val value = objectValue.get(key)

            if (
                value != null &&
                !value.isJsonNull &&
                value.isJsonPrimitive
            ) {
                return try {
                    value.asBoolean
                } catch (_: Exception) {
                    null
                }
            }
        }

        for ((_, value) in objectValue.entrySet()) {
            val result = findJsonBoolean(value, *keys)

            if (result != null) {
                return result
            }
        }
    }

    if (element.isJsonArray) {
        for (value in element.asJsonArray) {
            val result = findJsonBoolean(value, *keys)

            if (result != null) {
                return result
            }
        }
    }

    return null
}