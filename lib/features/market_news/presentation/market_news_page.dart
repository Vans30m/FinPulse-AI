import 'package:flutter/material.dart';

import '../../../core/network/news_api_service.dart';
import '../../../shared/models/news_article.dart';
import '../../../shared/widgets/news_tile.dart';
import '../data/market_news_repository.dart';

class MarketNewsPage extends StatelessWidget {
  const MarketNewsPage({super.key});

  @override
  Widget build(BuildContext context) {
    final repository = MarketNewsRepository(NewsApiService());

    return _NewsListView(
      title: 'Market News',
      loader: repository.fetchMarketNews,
    );
  }
}

class _NewsListView extends StatelessWidget {
  const _NewsListView({
    required this.title,
    required this.loader,
  });

  final String title;
  final Future<List<NewsArticle>> Function() loader;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: FutureBuilder<List<NewsArticle>>(
        future: loader(),
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
