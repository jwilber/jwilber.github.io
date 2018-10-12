"""Scrape soundtrack data from skatevideosite.com."""

import requests

import numpy as np
import pandas as pd

from bs4 import BeautifulSoup


def get_video_info(url):
    soundtrack = BeautifulSoup(requests.get(url, headers={'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.103 Safari/537.36'}).content)
    # Get name of video
    try:
        vid_name = soundtrack.find('h1').get_text()
        print vid_name
    except:
        return
    
    # Get info for video
    video_info = soundtrack.find_all('table')[0].find_all('tr')
    vid_info_dict = dict()
    for col in video_info:
        info = col.get_text()
        year = ''
        length = ''
        views = ''
        company = ''
        if 'Year' in info:
            year = info.replace('Year', '').strip()
            vid_info_dict['year'] = year
        if 'Length' in info:
            length = info.replace('Length', '').strip()
            vid_info_dict['length'] = length
        if 'Views' in info:
            views = info.replace('Views', '').strip()
            vid_info_dict['views'] = views
        if 'Company' in info:
            company = info.replace('Company', '').strip()
            vid_info_dict['company'] = company
    try:
        songs = soundtrack.find_all('table')[1].find_all('tr')
    except Exception as e:
        print "ERROR"
        print e
        print url
        return
    info_list = []
    
    for song in songs:
        details = song.get_text().split('-')
        if len(details) != 3:
            continue
        try:
            song_dict = {
                'year': vid_info_dict['year'],
                'length': vid_info_dict['length'],
                'views': vid_info_dict['views'],
                'company': vid_info_dict['company'],
                'video': vid_name,
                'part': details[0].strip(),
                'artist': details[1].strip(),
                'song': details[2].strip()
            }
        except:
            print "nope"
            print url
            continue
        info_list.append(song_dict)
    video_info_df = pd.DataFrame(info_list)
    return video_info_df

 def make_dataframe(url):
    page = requests.get(url)
    soup = BeautifulSoup(page.content, 'html.parser')
    
    # find all links in table id = skatevideos
    skate_videos = soup.find('table', id='skatevideos')
    
    
    # get links to all soundtracks on page
    URL_BASE = "http://www.skatevideosite.com"
    links = set(skate_videos.find_all('a', href=True))
    urls = [URL_BASE + link['href'] for link in links if 'online' not in link['href']]
    
    videos_list = [get_video_info(url) for url in urls]
    return videos_list
    

def main():

	web_pages = ["http://www.skatevideosite.com/index.php?page=skatevideos&sort=views&p={}".format(i) for i in range(1,20)]
	all_data = get_all_soundtracks(web_pages=web_pages)
	all_dfs = [pd.concat(data) for data in all_data]
	soundtrack_df = pd.concat(all_dfs).reset_index()
	soundtrack_df.to_csv('/Users/jared/Desktop/jenkem/data/raw_data.csv', encoding='utf8')