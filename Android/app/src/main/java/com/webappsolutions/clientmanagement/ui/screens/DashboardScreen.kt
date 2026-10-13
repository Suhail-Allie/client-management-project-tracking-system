package com.webappsolutions.clientmanagement.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.google.gson.JsonElement
import com.webappsolutions.clientmanagement.data.network.ApiClient
import com.webappsolutions.clientmanagement.navigation.AppRoutes

@Composable
fun DashboardScreen(
    onNavigate: (String) -> Unit
) {
    var displayName by remember {
        mutableStateOf("Welcome back")
    }

    var projectsCount by remember {
        mutableStateOf("—")
    }

    var milestonesCount by remember {
        mutableStateOf("—")
    }

    var invoicesCount by remember {
        mutableStateOf("—")
    }

    var notificationsCount by remember {
        mutableStateOf("—")
    }

    var isLoading by remember {
        mutableStateOf(true)
    }

    var errorMessage by remember {
        mutableStateOf<String?>(null)
    }

    var reloadTrigger by remember {
        mutableStateOf(0)
    }

    LaunchedEffect(reloadTrigger) {
        isLoading = true
        errorMessage = null

        try {
            // 1. Retrieve the authenticated user's profile.
            val profileResponse =
                ApiClient.service.getCurrentUser()

            if (!profileResponse.isSuccessful) {
                throw IllegalStateException(
                    when (profileResponse.code()) {
                        401 -> "Your session is not authenticated. Please sign in again."
                        403 -> "You do not have permission to access this information."
                        else -> "Unable to load your profile. HTTP ${profileResponse.code()}."
                    }
                )
            }

            val profile = profileResponse.body()

            displayName = profile?.let {
                findValue(
                    it,
                    listOf(
                        "display_name",
                        "displayName",
                        "full_name",
                        "fullName",
                        "name",
                        "email"
                    )
                )
            } ?: "Welcome back"

            // 2. Retrieve live dashboard statistics.
            val reportResponse =
                ApiClient.service.getReportSummary()

            if (!reportResponse.isSuccessful) {
                throw IllegalStateException(
                    "Unable to load dashboard reports. HTTP ${reportResponse.code()}."
                )
            }

            val report = reportResponse.body()
                ?: throw IllegalStateException(
                    "The reports API returned an empty response."
                )

            // Read values from the report response.
            // Multiple possible key names are supported because
            // the response may use camelCase or snake_case.

            projectsCount = readMetric(
                report,
                listOf(
                    "totalProjects",
                    "projectCount",
                    "projectsCount",
                    "total_projects",
                    "projects"
                )
            )

            milestonesCount = readMetric(
                report,
                listOf(
                    "totalMilestones",
                    "milestoneCount",
                    "milestonesCount",
                    "total_milestones",
                    "milestones"
                )
            )

            invoicesCount = readMetric(
                report,
                listOf(
                    "totalInvoices",
                    "invoiceCount",
                    "invoicesCount",
                    "total_invoices",
                    "invoices"
                )
            )

            notificationsCount = readMetric(
                report,
                listOf(
                    "unreadNotifications",
                    "unreadNotificationCount",
                    "totalNotifications",
                    "notificationCount",
                    "total_notifications",
                    "notifications"
                )
            )

            if (
                projectsCount == "—" &&
                milestonesCount == "—" &&
                invoicesCount == "—" &&
                notificationsCount == "—"
            ) {
                errorMessage =
                    "The reports endpoint responded, but its summary fields could not be identified."
            }

        } catch (exception: Exception) {
            errorMessage = exception.message
                ?: "Unable to load dashboard data. Please try again."
        } finally {
            isLoading = false
        }
    }

    Scaffold(
        bottomBar = {
            MobileBottomNavigation(
                currentRoute = AppRoutes.DASHBOARD,
                onNavigate = onNavigate
            )
        }
    ) { paddingValues ->

        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .verticalScroll(rememberScrollState())
                .padding(20.dp)
        ) {

            Text(
                text = "Dashboard",
                style = MaterialTheme.typography.headlineMedium
            )

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = displayName,
                style = MaterialTheme.typography.bodyLarge
            )

            Spacer(modifier = Modifier.height(24.dp))

            if (isLoading) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.Center,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    CircularProgressIndicator()

                    Spacer(modifier = Modifier.padding(6.dp))

                    Text("Loading dashboard data...")
                }

                Spacer(modifier = Modifier.height(24.dp))
            }

            // First row of live summary cards.
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                SummaryCard(
                    title = "Projects",
                    value = projectsCount,
                    modifier = Modifier.weight(1f)
                )

                SummaryCard(
                    title = "Milestones",
                    value = milestonesCount,
                    modifier = Modifier.weight(1f)
                )
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Second row of live summary cards.
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                SummaryCard(
                    title = "Invoices",
                    value = invoicesCount,
                    modifier = Modifier.weight(1f)
                )

                SummaryCard(
                    title = "Notifications",
                    value = notificationsCount,
                    modifier = Modifier.weight(1f)
                )
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Display API errors without crashing the screen.
            errorMessage?.let { message ->

                Card(
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp)
                    ) {
                        Text(
                            text = "Dashboard status",
                            style = MaterialTheme.typography.titleMedium
                        )

                        Spacer(modifier = Modifier.height(8.dp))

                        Text(
                            text = message,
                            color = MaterialTheme.colorScheme.error,
                            style = MaterialTheme.typography.bodyMedium
                        )
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))
            }

            Button(
                onClick = {
                    reloadTrigger++
                },
                enabled = !isLoading,
                modifier = Modifier.fillMaxWidth()
            ) {
                Text("Refresh Dashboard")
            }

            Spacer(modifier = Modifier.height(24.dp))

            Text(
                text = "Recent Activity",
                style = MaterialTheme.typography.titleLarge
            )

            Spacer(modifier = Modifier.height(12.dp))

            Card(
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(16.dp)
                ) {
                    Text(
                        text = "Activity feed not connected",
                        style = MaterialTheme.typography.titleMedium
                    )

                    Spacer(modifier = Modifier.height(8.dp))

                    Text(
                        text = "Recent activity will appear here once an activity-feed endpoint is available from the backend.",
                        style = MaterialTheme.typography.bodyMedium
                    )
                }
            }
        }
    }
}

@Composable
fun SummaryCard(
    title: String,
    value: String,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Text(
                text = value,
                style = MaterialTheme.typography.headlineSmall
            )

            Spacer(modifier = Modifier.height(4.dp))

            Text(
                text = title,
                style = MaterialTheme.typography.bodyMedium
            )
        }
    }
}

@Composable
fun MobileBottomNavigation(
    currentRoute: String,
    onNavigate: (String) -> Unit
) {
    NavigationBar {

        NavigationBarItem(
            selected = currentRoute == AppRoutes.DASHBOARD,
            onClick = {
                if (currentRoute != AppRoutes.DASHBOARD) {
                    onNavigate(AppRoutes.DASHBOARD)
                }
            },
            icon = {
                Text("D")
            },
            label = {
                Text("Dashboard")
            }
        )

        NavigationBarItem(
            selected = currentRoute == AppRoutes.PROJECTS,
            onClick = {
                if (currentRoute != AppRoutes.PROJECTS) {
                    onNavigate(AppRoutes.PROJECTS)
                }
            },
            icon = {
                Text("P")
            },
            label = {
                Text("Projects")
            }
        )

        NavigationBarItem(
            selected = currentRoute == AppRoutes.NOTIFICATIONS,
            onClick = {
                if (currentRoute != AppRoutes.NOTIFICATIONS) {
                    onNavigate(AppRoutes.NOTIFICATIONS)
                }
            },
            icon = {
                Text("N")
            },
            label = {
                Text("Alerts")
            }
        )

        NavigationBarItem(
            selected = currentRoute == AppRoutes.SETTINGS,
            onClick = {
                if (currentRoute != AppRoutes.SETTINGS) {
                    onNavigate(AppRoutes.SETTINGS)
                }
            },
            icon = {
                Text("S")
            },
            label = {
                Text("Settings")
            }
        )
    }
}

/**
 * Reads a value from a JSON response using possible field names.
 * Supports nested JSON objects and arrays.
 */
private fun readMetric(
    root: JsonElement,
    aliases: List<String>
): String {
    return findValue(root, aliases) ?: "—"
}

/**
 * Finds the first non-empty string or numeric JSON value
 * matching the requested field names.
 */
private fun findValue(
    root: JsonElement,
    aliases: List<String>
): String? {

    for (alias in aliases) {
        val result = findValueByKey(
            element = root,
            targetKey = normalizeKey(alias)
        )

        if (!result.isNullOrBlank()) {
            return result
        }
    }

    return null
}

private fun findValueByKey(
    element: JsonElement,
    targetKey: String
): String? {

    if (element.isJsonObject) {
        val objectValue = element.asJsonObject

        // Check direct properties first.
        for ((key, value) in objectValue.entrySet()) {

            if (
                normalizeKey(key) == targetKey &&
                value.isJsonPrimitive
            ) {
                val primitive = value.asJsonPrimitive

                if (primitive.isString || primitive.isNumber) {
                    return primitive.asString
                        .takeIf { it.isNotBlank() }
                }
            }
        }

        // Search nested objects.
        for ((_, value) in objectValue.entrySet()) {
            val result = findValueByKey(
                element = value,
                targetKey = targetKey
            )

            if (!result.isNullOrBlank()) {
                return result
            }
        }
    }

    if (element.isJsonArray) {
        for (value in element.asJsonArray) {
            val result = findValueByKey(
                element = value,
                targetKey = targetKey
            )

            if (!result.isNullOrBlank()) {
                return result
            }
        }
    }

    return null
}

private fun normalizeKey(value: String): String {
    return value
        .filter { it.isLetterOrDigit() }
        .lowercase()
}