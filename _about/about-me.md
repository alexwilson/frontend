---
layout: base
title: About me
permalink: /about-me/
share: false
itemtype: http://schema.org/Person
---

<h1 class="align-center">About me</h1>
<div class="alex-article">
    <div class="alex-article__main" itemscope="" itemtype="{{ itemtype }}">
        <section>
            <div class="alex-article__body">
                <p>
                    My name is Alex, and I'm a driven full-stack software engineer on a mission to deliver superb experiences to both developers and users alike.
                </p>
                <p>
                    I enjoy playing videogames and watching both TV and film, but most often can be found reading or tinkering with computers, servers or code.
                </p>
            </div>
        </section>
    </div>
    <div class="alex-article__aside">
        {% include atom/image.html
            class=''
            src=site.github.owner_gravatar_url
            alt='Me'
        %}
    </div>
</div>