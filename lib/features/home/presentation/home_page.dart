import 'package:flutter/material.dart';

import '../../international_news/presentation/international_news_page.dart';
import '../../market_news/presentation/market_news_page.dart';
import '../../national_news/presentation/national_news_page.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  int _currentIndex = 0;

  final List<Widget> _pages = const [
    MarketNewsPage(),
    InternationalNewsPage(),
    NationalNewsPage(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _pages[_currentIndex],
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: (index) {
          setState(() {
            _currentIndex = index;
          });
        },
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.trending_up),
            label: 'Market',
          ),
          NavigationDestination(
            icon: Icon(Icons.public),
            label: 'International',
          ),
          NavigationDestination(
            icon: Icon(Icons.flag),
            label: 'National',
          ),
        ],
      ),
    );
  }
}
