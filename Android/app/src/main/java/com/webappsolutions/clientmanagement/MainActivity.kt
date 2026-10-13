package com.webappsolutions.clientmanagement

import android.content.Intent
import android.os.Bundle
import android.util.Log
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.navigation.compose.rememberNavController
import com.webappsolutions.clientmanagement.data.network.supabaseClient
import com.webappsolutions.clientmanagement.navigation.AppNavGraph
import com.webappsolutions.clientmanagement.ui.theme.ClientManagementTheme
import io.github.jan.supabase.auth.handleDeeplinks

class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        handleAuthIntent(intent)

        setContent {
            ClientManagementTheme {
                Surface(
                    color = MaterialTheme.colorScheme.background
                ) {
                    val navController = rememberNavController()

                    AppNavGraph(
                        navController = navController
                    )
                }
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        handleAuthIntent(intent)
    }

    private fun handleAuthIntent(authIntent: Intent) {
        supabaseClient.handleDeeplinks(
            intent = authIntent,
            onSessionSuccess = { session ->
                Log.i(
                    "GoogleSSO",
                    "Authentication successful for ${
                        session.user?.email ?: "user"
                    }"
                )
            }
        )
    }
}