<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| SPA catch-all — serve the React app for every non-API web request so
| that React Router can handle client-side navigation on page refresh.
|--------------------------------------------------------------------------
*/
Route::get('/{any}', function () {
    return view('welcome');
})->where('any', '^(?!api).*$');
