<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{ $f->name }} — CV</title>
    <style>
        * { box-sizing: border-box; }
        body { font-family: DejaVu Sans, sans-serif; font-size: 11px; color: #222; margin: 0; }
        .header { background: #0b0b0d; color: #fff; padding: 24px 28px; }
        .header h1 { margin: 0; font-size: 24px; letter-spacing: .5px; }
        .header .headline { color: #f9b233; font-size: 12px; margin-top: 4px; }
        .header .contact { margin-top: 10px; font-size: 10px; color: #cfcfcf; }
        .header .contact span { margin-right: 12px; }
        .wrap { padding: 22px 28px; }
        h2 { font-size: 13px; text-transform: uppercase; letter-spacing: 1px; color: #0b0b0d;
             border-bottom: 2px solid #f9b233; padding-bottom: 4px; margin: 18px 0 10px; }
        .item { margin-bottom: 10px; }
        .item .row { width: 100%; }
        .item .title { font-weight: bold; font-size: 12px; }
        .item .sub { color: #9c6110; font-size: 11px; }
        .item .meta { color: #777; font-size: 10px; }
        .item .desc { margin-top: 3px; color: #444; line-height: 1.45; }
        .bio { line-height: 1.5; color: #444; }
        .skills td { padding: 3px 0; font-size: 11px; }
        .bar { background: #eee; height: 7px; width: 100%; }
        .bar span { display: block; height: 7px; background: #f9b233; }
        ul { margin: 4px 0 0 14px; padding: 0; }
        li { margin-bottom: 2px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>{{ $f->name }}</h1>
        @if($f->headline)<div class="headline">{{ $f->headline }}</div>@endif
        <div class="contact">
            @if($f->email)<span>{{ $f->email }}</span>@endif
            @if($f->phone)<span>{{ $f->phone }}</span>@endif
            @if($f->location)<span>{{ $f->location }}</span>@endif
        </div>
    </div>

    <div class="wrap">
        @if($f->bio)
            <h2>Profile</h2>
            <div class="bio">{{ $f->bio }}</div>
        @endif

        @if($f->experiences->count())
            <h2>Work Experience</h2>
            @foreach($f->experiences as $e)
                <div class="item">
                    <div class="title">{{ $e->position }}
                        <span class="meta">
                            — {{ $e->start_date?->format('M Y') }}
                            {{ $e->is_current ? '— Present' : ($e->end_date ? '— '.$e->end_date->format('M Y') : '') }}
                        </span>
                    </div>
                    <div class="sub">{{ $e->company }}@if($e->location) · {{ $e->location }}@endif</div>
                    @if($e->description)<div class="desc">{{ $e->description }}</div>@endif
                </div>
            @endforeach
        @endif

        @if($f->internships->count())
            <h2>Internships</h2>
            @foreach($f->internships as $i)
                <div class="item">
                    <div class="title">{{ $i->position }}
                        <span class="meta">
                            — {{ $i->start_date?->format('M Y') }}{{ $i->end_date ? ' — '.$i->end_date->format('M Y') : '' }}
                        </span>
                    </div>
                    <div class="sub">{{ $i->company }}@if($i->location) · {{ $i->location }}@endif</div>
                    @if($i->description)<div class="desc">{{ $i->description }}</div>@endif
                </div>
            @endforeach
        @endif

        @if($f->diplomas->count())
            <h2>Education</h2>
            @foreach($f->diplomas as $d)
                <div class="item">
                    <div class="title">{{ $d->title }}
                        <span class="meta">— {{ collect([$d->start_year, $d->end_year])->filter()->implode(' — ') }}</span>
                    </div>
                    <div class="sub">{{ $d->institution }}@if($d->field) · {{ $d->field }}@endif</div>
                    @if($d->description)<div class="desc">{{ $d->description }}</div>@endif
                </div>
            @endforeach
        @endif

        @if($f->skills->count())
            <h2>Skills</h2>
            <table class="skills" width="100%">
                @foreach($f->skills as $s)
                    <tr>
                        <td width="35%">{{ $s->name }}</td>
                        <td width="55%"><div class="bar"><span style="width: {{ max(0, min(100, $s->level)) }}%"></span></div></td>
                        <td width="10%" align="right">{{ $s->level }}%</td>
                    </tr>
                @endforeach
            </table>
        @endif

        @if($f->projects->count())
            <h2>Projects</h2>
            @foreach($f->projects as $p)
                <div class="item">
                    <div class="title">{{ $p->title }}</div>
                    @if($p->tech_stack)<div class="sub">{{ $p->tech_stack }}</div>@endif
                    @if($p->description)<div class="desc">{{ $p->description }}</div>@endif
                    @if($p->live_url)<div class="meta">{{ $p->live_url }}</div>@endif
                </div>
            @endforeach
        @endif
    </div>
</body>
</html>
