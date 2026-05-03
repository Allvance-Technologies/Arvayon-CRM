<?php

namespace App\Policies;

use App\Models\SavedFilter;
use App\Models\User;

class SavedFilterPolicy
{
    public function view(User $user, SavedFilter $savedFilter)
    {
        return $user->id === $savedFilter->user_id;
    }

    public function update(User $user, SavedFilter $savedFilter)
    {
        return $user->id === $savedFilter->user_id;
    }

    public function delete(User $user, SavedFilter $savedFilter)
    {
        return $user->id === $savedFilter->user_id;
    }
}
