import '../../../core/network/news_api_service.dart';
import '../../../shared/models/news_article.dart';

class InternationalNewsRepository {
  const InternationalNewsRepository(this._service);

  final NewsApiService _service;

  Future<List<NewsArticle>> fetchInternationalNews() {
    return _service.getTopHeadlines(country: 'us');
  }
}
