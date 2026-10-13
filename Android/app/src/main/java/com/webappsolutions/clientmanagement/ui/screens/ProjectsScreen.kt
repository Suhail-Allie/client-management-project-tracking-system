package com.webappsolutions.clientmanagement.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.AssistChip
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

private data class ProjectUiModel(
    val id: String,
    val projectCode: String,
    val name: String,
    val description: String,
    val status: String,
    val priority: String
)

@Composable
fun ProjectsScreen(
    onNavigate: (String) -> Unit
) {
    var projects by remember {
        mutableStateOf<List<ProjectUiModel>>(emptyList())
    }

    var isLoading by remember {
        mutableStateOf(true)
    }

    var errorMessage by remember {
        mutableStateOf<String?>(null)
    }

    val scope = rememberCoroutineScope()

    suspend fun loadProjects() {
        isLoading = true
        errorMessage = null

        try {
            val response = ApiClient.service.getProjects()

            if (response.isSuccessful) {
                val body = response.body()

                if (body != null) {
                    val array = findFirstArray(body)

                    if (array != null) {
                        projects = array.mapNotNull { element ->
                            element.takeIf { it.isJsonObject }
                                ?.asJsonObject
                                ?.toProjectUiModel()
                        }
                    } else {
                        projects = emptyList()
                    }
                } else {
                    projects = emptyList()
                }
            } else {
                errorMessage =
                    "Unable to load projects. Server returned ${response.code()}."
            }
        } catch (exception: Exception) {
            errorMessage =
                exception.message ?: "Unable to connect to the API."
        } finally {
            isLoading = false
        }
    }

    LaunchedEffect(Unit) {
        loadProjects()
    }

    Scaffold(
        bottomBar = {
            AppBottomNavigation(
                currentRoute = AppRoutes.PROJECTS,
                onNavigate = onNavigate
            )
        }
    ) { paddingValues ->

        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(16.dp)
        ) {

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "Projects",
                        style = MaterialTheme.typography.headlineMedium,
                        fontWeight = FontWeight.Bold
                    )

                    Text(
                        text = "${projects.size} project(s)",
                        style = MaterialTheme.typography.bodyMedium
                    )
                }

                TextButton(
                    onClick = {
                        scope.launch {
                            loadProjects()
                        }
                    }
                ) {
                    Text("Refresh")
                }
            }

            when {
                isLoading -> {
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(top = 48.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Top
                    ) {
                        CircularProgressIndicator()

                        Text(
                            text = "Loading projects...",
                            modifier = Modifier.padding(top = 12.dp)
                        )
                    }
                }

                errorMessage != null -> {
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(top = 48.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            text = "Something went wrong",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )

                        Text(
                            text = errorMessage ?: "Unknown error",
                            modifier = Modifier.padding(
                                top = 8.dp,
                                bottom = 16.dp
                            )
                        )

                        Button(
                            onClick = {
                                scope.launch {
                                    loadProjects()
                                }
                            }
                        ) {
                            Text("Try Again")
                        }
                    }
                }

                projects.isEmpty() -> {
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(top = 48.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            text = "No projects found",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )

                        Text(
                            text = "No projects are currently available for this account.",
                            modifier = Modifier.padding(top = 8.dp)
                        )
                    }
                }

                else -> {
                    LazyColumn(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(top = 16.dp),
                        contentPadding = PaddingValues(bottom = 16.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        items(
                            items = projects,
                            key = { project -> project.id }
                        ) { project ->

                            ProjectCard(
                                project = project
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun ProjectCard(
    project: ProjectUiModel
) {
    Card(
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {

            Text(
                text = project.name,
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold
            )

            if (project.projectCode.isNotBlank()) {
                Text(
                    text = project.projectCode,
                    style = MaterialTheme.typography.bodySmall,
                    modifier = Modifier.padding(top = 4.dp)
                )
            }

            if (project.description.isNotBlank()) {
                Text(
                    text = project.description,
                    style = MaterialTheme.typography.bodyMedium,
                    modifier = Modifier.padding(top = 12.dp)
                )
            }

            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 14.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {

                if (project.status.isNotBlank()) {
                    AssistChip(
                        onClick = {},
                        label = {
                            Text(
                                text = formatDisplayText(project.status)
                            )
                        }
                    )
                }

                if (project.priority.isNotBlank()) {
                    AssistChip(
                        onClick = {},
                        label = {
                            Text(
                                text = "Priority: ${
                                    formatDisplayText(project.priority)
                                }"
                            )
                        }
                    )
                }
            }
        }
    }
}

private fun JsonObject.toProjectUiModel(): ProjectUiModel {
    return ProjectUiModel(
        id = getStringValue(
            "id",
            "project_id"
        ),
        projectCode = getStringValue(
            "project_code",
            "projectCode",
            "code"
        ),
        name = getStringValue(
            "name",
            "project_name",
            "projectName"
        ).ifBlank {
            "Unnamed Project"
        },
        description = getStringValue(
            "description",
            "project_description",
            "projectDescription"
        ),
        status = getStringValue(
            "status",
            "project_status",
            "projectStatus"
        ),
        priority = getStringValue(
            "priority",
            "project_priority",
            "projectPriority"
        )
    )
}

private fun JsonObject.getStringValue(
    vararg keys: String
): String {
    for (key in keys) {
        val value = get(key)

        if (value != null &&
            !value.isJsonNull &&
            value.isJsonPrimitive
        ) {
            return value.asString
        }
    }

    return ""
}

private fun findFirstArray(
    element: JsonElement
): JsonArray? {

    if (element.isJsonArray) {
        return element.asJsonArray
    }

    if (element.isJsonObject) {
        for ((_, child) in element.asJsonObject.entrySet()) {
            val result = findFirstArray(child)

            if (result != null) {
                return result
            }
        }
    }

    return null
}

private fun formatDisplayText(
    value: String
): String {
    return value
        .replace("_", " ")
        .replace("-", " ")
        .lowercase()
        .split(" ")
        .joinToString(" ") { word ->
            word.replaceFirstChar { character ->
                character.uppercase()
            }
        }
}