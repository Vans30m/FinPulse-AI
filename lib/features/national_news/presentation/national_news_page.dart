import 'package:flutter/material.dart';

import '../../../core/network/news_api_service.dart';
import '../../../shared/models/news_article.dart';
import '../../../shared/widgets/news_tile.dart';
import '../data/national_news_repository.dart';

class NationalNewsPage extends StatelessWidget {
  const NationalNewsPage({super.key});

  @override
  Widget build(BuildContext context) {
    final repository = NationalNewsRepository(NewsApiService());

    return Scaffold(
      appBar: AppBar(title: const Text('National News')),
      body: FutureBuilder<List<NewsArticle>>(
        future: repository.fetchNationalNews(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          if (snapshot.hasError) {
            return Center(child: Text('Error: ${snapshot.error}'));
          }

          final articles = snapshot.data ?? const [];
          if (articles.isEmpty) {
            return const Center(child: Text('No articles found'));
          }

          return ListView.builder(
            padding: const EdgeInsets.all(12),
            itemCount: articles.length,
            itemBuilder: (context, index) {
              return NewsTile(article: articles[index]);
            },
          );
        },
      ),
    );
  }
}
