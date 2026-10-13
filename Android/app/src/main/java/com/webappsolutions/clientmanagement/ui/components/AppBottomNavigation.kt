package com.webappsolutions.clientmanagement.ui.components

import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import com.webappsolutions.clientmanagement.navigation.AppRoutes

private data class NavigationDestination(
    val label: String,
    val route: String
)

@Composable
fun AppBottomNavigation(
    currentRoute: String,
    onNavigate: (String) -> Unit
) {
    val destinations = listOf(
        NavigationDestination(
            label = "Dashboard",
            route = AppRoutes.DASHBOARD
        ),
        NavigationDestination(
            label = "Projects",
            route = AppRoutes.PROJECTS
        ),
        NavigationDestination(
            label = "Notifications",
            route = AppRoutes.NOTIFICATIONS
        ),
        NavigationDestination(
            label = "Settings",
            route = AppRoutes.SETTINGS
        )
    )

    NavigationBar {
        destinations.forEach { destination ->

            NavigationBarItem(
                selected = currentRoute == destination.route,
                onClick = {
                    if (currentRoute != destination.route) {
                        onNavigate(destination.route)
                    }
                },
                icon = {
                    Text(
                        text = destination.label.take(1)
                    )
                },
                label = {
                    Text(destination.label)
                }
            )
        }
    }
}