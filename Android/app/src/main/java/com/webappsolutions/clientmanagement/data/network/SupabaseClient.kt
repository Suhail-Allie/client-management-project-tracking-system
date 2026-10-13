package com.webappsolutions.clientmanagement.data.network

import io.github.jan.supabase.auth.Auth
import io.github.jan.supabase.auth.FlowType
import io.github.jan.supabase.auth.providers.Google
import io.github.jan.supabase.createSupabaseClient
import io.github.jan.supabase.auth.auth

private const val SUPABASE_URL =
    "https://cvmuzbgsufzldsawbdvc.supabase.co"

private const val SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_45fI6BpuJUpeHxOyiwEFGw_5So-PMJn"

val supabaseClient = createSupabaseClient(
    supabaseUrl = SUPABASE_URL,
    supabaseKey = SUPABASE_PUBLISHABLE_KEY
) {
    install(Auth) {
        scheme = "com.webappsolutions.clientmanagement"
        host = "login-callback"
        flowType = FlowType.PKCE
    }
}

suspend fun signInWithGoogle() {
    supabaseClient.auth.signInWith(Google)
}