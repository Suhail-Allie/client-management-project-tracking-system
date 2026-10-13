package com.webappsolutions.clientmanagement.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import com.webappsolutions.clientmanagement.ui.screens.DashboardScreen
import com.webappsolutions.clientmanagement.ui.screens.LoginScreen
import com.webappsolutions.clientmanagement.ui.screens.NotificationsScreen
import com.webappsolutions.clientmanagement.ui.screens.ProjectsScreen
import com.webappsolutions.clientmanagement.ui.screens.SettingsScreen

object AppRoutes {
    const val LOGIN = "login"
    const val DASHBOARD = "dashboard"
    const val PROJECTS = "projects"
    const val NOTIFICATIONS = "notifications"
    const val SETTINGS = "settings"
}

@Composable
fun AppNavGraph(
    navController: NavHostController,
    startDestination: String = AppRoutes.LOGIN
) {
    NavHost(
        navController = navController,
        startDestination = startDestination
    ) {
        composable(AppRoutes.LOGIN) {
            LoginScreen(
                onLoginSuccess = {
                    navController.navigate(AppRoutes.DASHBOARD) {
                        popUpTo(AppRoutes.LOGIN) {
                            inclusive = true
                        }
                    }
                }
            )
        }

        composable(AppRoutes.DASHBOARD) {
            DashboardScreen(
                onNavigate = { route ->
                    navController.navigate(route)
                }
            )
        }

        composable(AppRoutes.PROJECTS) {
            ProjectsScreen(
                onNavigate = { route ->
                    navController.navigate(route)
                }
            )
        }

        composable(AppRoutes.NOTIFICATIONS) {
            NotificationsScreen(
                onNavigate = { route ->
                    navController.navigate(route)
                }
            )
        }

        composable(AppRoutes.SETTINGS) {
            SettingsScreen(
                onNavigate = { route ->
                    navController.navigate(route)
                }
            )
        }
    }
}