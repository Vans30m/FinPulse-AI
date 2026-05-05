import '../../../core/network/news_api_service.dart';
import '../../../shared/models/news_article.dart';

class MarketNewsRepository {
  const MarketNewsRepository(this._service);

  final NewsApiService _service;

  Future<List<NewsArticle>> fetchMarketNews() {
    return _service.getTopHeadlines(category: 'business');
  }
}
