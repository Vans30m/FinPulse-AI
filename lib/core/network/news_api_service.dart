import 'dart:convert';

import 'package:http/http.dart' as http;

import '../../shared/models/news_article.dart';
import '../config/app_config.dart';
import '../constants/api_endpoints.dart';

class NewsApiService {
  Future<List<NewsArticle>> getTopHeadlines({
    String? country,
    String? category,
    int pageSize = 20,
  }) async {
    final uri = Uri.parse('${ApiEndpoints.baseUrl}${ApiEndpoints.topHeadlines}')
        .replace(
      queryParameters: {
        if (country != null) 'country': country,
        if (category != null) 'category': category,
        'pageSize': '$pageSize',
        'apiKey': AppConfig.newsApiKey,
      },
    );

    final response = await http.get(uri);
    if (response.statusCode != 200) {
      throw Exception('Failed to load news: ${response.statusCode}');
    }

    final Map<String, dynamic> data = jsonDecode(response.body);
    final List<dynamic> articles = data['articles'] as List<dynamic>? ?? [];

    return articles
        .map((article) => NewsArticle.fromJson(article as Map<String, dynamic>))
        .toList();
  }
}
