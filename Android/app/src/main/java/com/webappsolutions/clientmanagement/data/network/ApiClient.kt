package com.webappsolutions.clientmanagement.data.network

import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.auth.status.SessionStatus
import okhttp3.OkHttpClient
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

object ApiClient {

    // Android Emulator address for your local Node.js API.
    private const val BASE_URL =
        "https://client-management-api-14cs.onrender.com/"

    private val okHttpClient: OkHttpClient by lazy {

        OkHttpClient.Builder()
            .addInterceptor { chain ->

                // Retrieve the current authenticated session.
                val sessionStatus =
                    supabaseClient.auth.sessionStatus.value

                val accessToken = (
                        sessionStatus as? SessionStatus.Authenticated
                        )?.session?.accessToken

                val requestBuilder = chain.request()
                    .newBuilder()
                    .header("Accept", "application/json")

                // Attach the token to protected API requests.
                if (!accessToken.isNullOrBlank()) {
                    requestBuilder.header(
                        "Authorization",
                        "Bearer $accessToken"
                    )
                }

                chain.proceed(requestBuilder.build())
            }
            .build()
    }

    private val retrofit: Retrofit by lazy {

        Retrofit.Builder()
            .baseUrl(BASE_URL)
            .client(okHttpClient)
            .addConverterFactory(
                GsonConverterFactory.create()
            )
            .build()
    }

    val service: ApiService by lazy {
        retrofit.create(ApiService::class.java)
    }
}