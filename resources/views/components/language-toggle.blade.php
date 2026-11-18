{{-- Links to /locale/{lang}: Laravel stores the choice in a cookie and returns to the same page. --}}
<div class="lt-toggle" role="radiogroup" aria-label="{{ __('Language') }}" data-language-toggle>
    <a href="{{ url('locale/en') }}" role="radio" class="lt-opt {{ app()->getLocale() === 'en' ? 'lt-on' : '' }}" aria-checked="{{ app()->getLocale() === 'en' ? 'true' : 'false' }}" lang="en" title="English">EN</a>
    <a href="{{ url('locale/km') }}" role="radio" class="lt-opt {{ app()->getLocale() === 'km' ? 'lt-on' : '' }}" aria-checked="{{ app()->getLocale() === 'km' ? 'true' : 'false' }}" lang="km" title="ខ្មែរ">ខ្មែរ</a>
</div>
