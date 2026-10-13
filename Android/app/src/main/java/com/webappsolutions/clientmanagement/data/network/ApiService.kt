package com.webappsolutions.clientmanagement.data.network

import com.google.gson.JsonObject
import com.google.gson.JsonElement
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.PATCH
import retrofit2.http.Path

interface ApiService {

    // Health checks
    @GET("api/v1/health")
    suspend fun getHealth(): Response<JsonObject>

    @GET("api/v1/health/db")
    suspend fun getDatabaseHealth(): Response<JsonObject>

    // Authentication
    @GET("api/v1/auth/me")
    suspend fun getCurrentUser(): Response<JsonObject>

    // Dashboard reports
    @GET("api/v1/reports/summary")
    suspend fun getReportSummary(): Response<JsonObject>

    // Projects
    @GET("api/v1/projects")
    suspend fun getProjects(): Response<JsonObject>

    // Notifications
    @GET("api/v1/notifications")
    suspend fun getNotifications(): Response<JsonObject>

    @PATCH("api/v1/notifications/{id}")
    suspend fun updateNotification(
        @Path("id") id: String,
        @Body body: JsonObject
    ): Response<JsonObject>

    // User settings
    @GET("api/v1/user-settings")
    suspend fun getUserSettings(): Response<JsonElement>

    @PATCH("api/v1/user-settings")
    suspend fun updateUserSettings(
        @Body body: JsonObject
    ): Response<JsonElement>
}